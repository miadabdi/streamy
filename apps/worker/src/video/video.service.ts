import * as m3u8Parser from '@miadabdi/m3u8-parser';
import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { readFile, readdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { BUCKET_NAMES_TYPE, RFC5646_LANGUAGE_TAGS } from '../common/constants';
import { MinioClientService } from '../minio-client/minio-client.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import { VideoProcessingStatus } from './enum';
import { SetVideoStatusMsg } from './interface';
import { SubProcessMsg, VideoProcessMsg } from './interface/video-process-msg.interface';
import { VideoProcessService } from './video-process.service';

@Injectable()
export class VideoService {
	private logger = new Logger(VideoService.name);
	private videoFilesDir = join(__dirname, 'videoFiles');

	constructor(
		private consumerService: ConsumerService,
		private minioClientService: MinioClientService,
		private videoProcessService: VideoProcessService,
		private producerService: ProducerService,
	) {}

	async onModuleInit() {
		await this.consumerService.listenOnQueue(
			'q.video.process',
			this.processVideoCallback.bind(this),
		);

		if (!existsSync(this.videoFilesDir)) {
			mkdirSync(this.videoFilesDir);
		}
	}

	async downloadMinioFile(bucket: string, filePath: string, dirName: string) {
		const dedicatedDir = join(this.videoFilesDir, dirName);
		const localfilepath = join(dedicatedDir, filePath);

		console.log(__dirname, localfilepath);
		try {
			await this.minioClientService.client.fGetObject(bucket, filePath, localfilepath);
		} catch (err) {
			this.logger.error(`Error happend during download of ${filePath} of bucket ${bucket}`);
			this.logger.error(err);
		}

		return { localfilepath, dedicatedDir };
	}

	/** current in-flight job, exposed by the health endpoint */
	activeJob: { videoId: number; startedAt: string } | null = null;

	async processVideoCallback(message: VideoProcessMsg) {
		this.activeJob = { videoId: message.videoId, startedAt: new Date().toISOString() };
		try {
			await this.processVideo(message);
		} finally {
			this.activeJob = null;
		}
	}

	private async processVideo(message: VideoProcessMsg) {
		console.dir(message, { depth: null });
		const { localfilepath: videoFilePath, dedicatedDir } = await this.downloadMinioFile(
			message.bucketName,
			message.filePath,
			message.videoId.toString(),
		);

		this.producerService.addToQueue('q.set.video.status', {
			videoId: message.videoId,
			status: VideoProcessingStatus.processing,
		} as SetVideoStatusMsg);

		try {
			await this.videoProcessService.processVideo(videoFilePath, dedicatedDir);
		} catch (err: any) {
			let logs = 'no message';
			if (err.logs) logs = err.logs;
			else if (err.message) logs = err.message;

			this.producerService.addToQueue('q.set.video.status', {
				videoId: message.videoId,
				status: VideoProcessingStatus.failed_in_processing,
				logs,
			} as SetVideoStatusMsg);

			return;
		}

		for (const sub of message.subs) {
			const { localfilepath: subFilePath, dedicatedDir } = await this.downloadMinioFile(
				sub.bucketName,
				sub.filePath,
				message.videoId.toString(),
			);

			const langCode = sub.langRFC5646;
			// this would result into this sub file name
			const subFileName = `sub_vtt_${langCode}.m3u8`;

			try {
				await this.videoProcessService.processSubtitle(
					videoFilePath,
					subFilePath,
					dedicatedDir,
					langCode,
				);

				await this.addSubToMaster(dedicatedDir, sub, subFileName);
			} catch (err: any) {
				let logs = 'no message';
				if (err.logs) logs = err.logs;
				else if (err.message) logs = err.message;

				this.producerService.addToQueue('q.set.video.status', {
					videoId: message.videoId,
					status: VideoProcessingStatus.failed_in_processing,
					logs,
				} as SetVideoStatusMsg);

				this.logger.error(err);

				return;
			}
		}

		await this.moveFilesToMinio(dedicatedDir, message.videoId.toString());
		await this.removeDirectory(dedicatedDir);

		this.producerService.addToQueue('q.set.video.status', {
			videoId: message.videoId,
			status: VideoProcessingStatus.done,
		} as SetVideoStatusMsg);
	}

	async correctSubM3U8(dedicatedDir: string, subFileName: string) {
		// FFMPEG would put redundant video m3u8 and vtt m3u8 into the same file
		// we should remove redundant video m3u8

		const subPath = join(dedicatedDir, subFileName);

		let subData: string;
		try {
			subData = await readFile(subPath, { encoding: 'utf8' });
		} catch (err) {
			this.logger.error('Error in opening sub m3u8 file', err, { subPath });
		}

		const searchText = '#EXT-X-ENDLIST';
		subData = subData.substring(0, subData.indexOf(searchText)) + searchText;

		try {
			await writeFile(subPath, subData, {
				encoding: 'utf8',
			});
		} catch (err) {
			this.logger.error('Error in writing sub m3u8 file', err, { subPath });
		}
	}

	async addSubToMaster(dedicatedDir: string, subMessage: SubProcessMsg, subFileName: string) {
		await this.correctSubM3U8(dedicatedDir, subFileName);

		const masterFilePath = join(dedicatedDir, 'master.m3u8');
		let masterData;
		try {
			masterData = await readFile(masterFilePath, { encoding: 'utf8' });
		} catch (err) {
			this.logger.error('Error in opening master file', err, { masterFilePath });
		}

		// loading m3u8 master to parser
		const parser = new m3u8Parser.Parser();
		parser.push(masterData);
		parser.end();

		const langName = RFC5646_LANGUAGE_TAGS[subMessage.langRFC5646];

		// group name subtitle0 is hardcoded. changing this may cause errors
		const subtitles = parser.manifest.mediaGroups.SUBTITLES.subtitles || {};
		subtitles[langName] = {
			default: false,
			autoselect: false,
			forced: false,
			language: subMessage.langRFC5646,
			uri: subFileName,
		};

		// there will be only one subtitle group and it is called 'subtitles'
		parser.manifest.mediaGroups.SUBTITLES.subtitles = subtitles;

		parser.manifest.playlists = parser.manifest.playlists.map((playlist) => {
			// adding subtitle group to every variant in the master file
			playlist.attributes.SUBTITLES = 'subtitles';
			return playlist;
		});

		try {
			await writeFile(masterFilePath, parser.stringify(), {
				encoding: 'utf8',
			});
		} catch (err) {
			this.logger.error('Error in writing master file', err, { masterFilePath });
		}
	}

	async moveFilesToMinio(dedicatedDir: string, minioDir: string) {
		const files = await readdir(dedicatedDir);

		for (const fileName of files) {
			if (
				fileName.startsWith('manifest_') ||
				fileName.startsWith('master.m3u8') ||
				fileName.startsWith('segment_') ||
				fileName.startsWith('sub_vtt_')
			) {
				const filePath = join(dedicatedDir, fileName);

				await this.minioClientService.client.fPutObject('hls', join(minioDir, fileName), filePath);
			}
		}
	}

	async removeDirectory(dir: string) {
		await rm(dir, { recursive: true, force: true });
	}
}
