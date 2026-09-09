import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { readdir, rm } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import { MinioClientService } from '../minio-client/minio-client.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import { VideoProcessingStatus } from '../video/enum';
import { SetVideoStatusMsg } from '../video/interface';
import { VideoProcessService } from '../video/video-process.service';
import { LiveUploader } from './live-uploader';
import { LiveProcessMsg } from './interface';

@Injectable()
export class LiveService {
	private logger = new Logger(LiveService.name);
	private videoFilesDir = join(__dirname, 'liveFiles');

	constructor(
		private configService: ConfigService,
		private videoProcessService: VideoProcessService,
		private minioClientService: MinioClientService,
		private consumerService: ConsumerService,
		private producerService: ProducerService,
	) {}

	async onModuleInit() {
		// pull-model consumer, same as vod: a live job is taken only when a
		// slot is free, acked on receipt, and extras stay queued in rabbitmq
		const concurrency = this.configService.get<number>('LIVE_PROCESS_CONCURRENCY') ?? 1;
		await this.consumerService.pollOnQueue(
			'q.live.process',
			(message: LiveProcessMsg) => this.runLiveJob(message),
			{
				concurrency,
				keyOf: (message: LiveProcessMsg) => message.streamKey,
				duplicateLabel: 'live job',
			},
		);

		if (!existsSync(this.videoFilesDir)) {
			mkdirSync(this.videoFilesDir);
		}
	}

	private async runLiveJob(message: LiveProcessMsg) {
		// unique per job: an encoder reconnect queues a second job for the same
		// stream — a shared dir made the jobs corrupt each other's final sweep
		const dedicatedDir = join(this.videoFilesDir, `${message.streamKey}-${Date.now()}`);

		// resume leg: previous playlists spliced ahead of this leg's entries on
		// every upload (undefined on a fresh broadcast)
		let prefixes: Map<string, string> | undefined;
		let startNumber = 1;

		try {
			mkdirSync(dedicatedDir, { recursive: true });

			if (message.resume) {
				({ prefixes, startNumber } = await this.prepareResume(message.id));
			}

			const srsHost = this.configService.get<string>('SRS_RTMP_HOST') ?? 'localhost';
			const rtmpUrl = `rtmp://${srsHost}:1935/${message.app}/${message.streamKey}`;
			// give srs a moment to settle before pulling the stream
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// upload segments while the broadcast runs so viewers can watch live
			// (hls path uses the integer id, same convention as vod output)
			const uploader = new LiveUploader(
				dedicatedDir,
				message.id.toString(),
				this.minioClientService.client,
				prefixes,
			);
			const intervalMs = (this.configService.get<number>('LIVE_UPLOAD_INTERVAL') ?? 5) * 1000;
			let ticking = false;
			const watcher = setInterval(() => {
				if (ticking) return;
				ticking = true;
				uploader
					.tick()
					.catch((err) => this.logger.warn(`live upload tick failed: ${err.message}`))
					.finally(() => (ticking = false));
			}, intervalMs);

			try {
				// attaching to srs before the publisher's source is established can
				// land the pull on an empty source that never delivers data; if the
				// pull dies with no output at all, retry a few seconds later
				for (let attempt = 1; attempt <= 3; attempt++) {
					try {
						// resolves when the rtmp source ends and ffmpeg exits cleanly
						await this.videoProcessService.processLiveVideo(rtmpUrl, dedicatedDir, startNumber);
						break;
					} catch (err) {
						const files = await readdir(dedicatedDir).catch(() => [] as string[]);
						const producedOutput = files.some((f) => f.endsWith('.ts') || f.endsWith('.m3u8'));
						if (producedOutput || attempt === 3) throw err;
						this.logger.warn(
							`live pull attempt ${attempt} for ${message.streamKey} got no data, retrying in 3s`,
						);
						await new Promise((resolve) => setTimeout(resolve, 3000));
					}
				}
			} finally {
				clearInterval(watcher);
			}

			// ffmpeg has exited: every file is final, push the tail + playlists
			await uploader.flush();
			await this.removeDirectory(dedicatedDir);

			this.producerService.addToQueue('q.set.video.status', {
				videoId: message.id,
				status: VideoProcessingStatus.done,
			} as SetVideoStatusMsg);
		} catch (err: any) {
			let logs = 'no message';
			if (err.logs) logs = err.logs;
			else if (err.message) logs = err.message;

			this.logger.error(`live processing of ${message.streamKey} failed: ${logs}`);

			// best effort: flush whatever was produced so the partial stream is
			// playable; the splice prefixes matter here too, or the flush would
			// overwrite the previous leg's playlist with only this leg's tail
			try {
				const uploader = new LiveUploader(
					dedicatedDir,
					message.id.toString(),
					this.minioClientService.client,
					prefixes,
				);
				await uploader.flush();
			} catch (flushErr: any) {
				this.logger.error(`live flush on failure also failed: ${flushErr.message}`);
			}
			await this.removeDirectory(dedicatedDir).catch(() => {});

			this.producerService.addToQueue('q.set.video.status', {
				videoId: message.id,
				status: VideoProcessingStatus.failed_in_processing,
				logs,
			} as SetVideoStatusMsg);
		}
	}

	/**
	 * resume leg: pull each variant's stored playlist. the next segment number
	 * continues after the fullest variant so this leg's files never collide
	 * with what is already uploaded. a variant that is missing or produced no
	 * segments contributes nothing; if none did, the broadcast starts fresh.
	 */
	private async prepareResume(videoId: number): Promise<{
		prefixes: Map<string, string>;
		startNumber: number;
	}> {
		const variants = ['1080p', '720p', '360p'];
		const prefixes = new Map<string, string>();
		let maxCount = 0;

		for (const variant of variants) {
			try {
				const stream = await this.minioClientService.client.getObject(
					'hls',
					`${videoId}/manifest_${variant}.m3u8`,
				);
				const content = await this.readObject(stream);
				const segmentCount = (content.match(/\.ts/g) ?? []).length;
				if (segmentCount === 0) continue;
				maxCount = Math.max(maxCount, segmentCount);
				// the previous leg wrote an ENDLIST on exit; the spliced playlist
				// must not terminate before this leg's entries
				prefixes.set(`manifest_${variant}.m3u8`, content.replace(/#EXT-X-ENDLIST\n?$/, ''));
			} catch (err: any) {
				this.logger.warn(`resume splice: no usable manifest for ${variant}: ${err.message}`);
			}
		}

		return { prefixes, startNumber: prefixes.size ? maxCount + 1 : 1 };
	}

	private readObject(stream: Readable): Promise<string> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			// minio yields buffers, but a mocked/edge stream may yield strings
			stream.on('data', (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
			stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
			stream.on('error', reject);
		});
	}

	private async removeDirectory(dir: string) {
		await rm(dir, { recursive: true, force: true });
	}
}
