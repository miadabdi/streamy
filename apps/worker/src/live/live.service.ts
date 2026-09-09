import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { readdir, rm } from 'fs/promises';
import { join } from 'path';
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
	// in-process gate: messages are acked on receipt (so rabbitmq's prefetch
	// cannot bound them) — this set + fifo enforce the same semantics locally
	private runningKeys = new Set<string>();
	private runningCount = 0;
	private maxConcurrent = 1;
	private waiters: Array<() => void> = [];

	constructor(
		private configService: ConfigService,
		private videoProcessService: VideoProcessService,
		private minioClientService: MinioClientService,
		private consumerService: ConsumerService,
		private producerService: ProducerService,
	) {}

	async onModuleInit() {
		// ack on receipt: a live job runs for the whole broadcast and would
		// otherwise be redelivered as a corrupting duplicate on any timeout;
		// the in-process gate below replaces the prefetch bound this acking gives up
		this.maxConcurrent = this.configService.get<number>('LIVE_PROCESS_CONCURRENCY') ?? 1;
		await this.consumerService.listenOnQueue(
			'q.live.process',
			this.processLiveCallback.bind(this),
			{
				ackOnReceipt: true,
			},
		);

		if (!existsSync(this.videoFilesDir)) {
			mkdirSync(this.videoFilesDir);
		}
	}

	async processLiveCallback(message: LiveProcessMsg) {
		// a job already runs for this stream: its rtmp pull follows whatever srs
		// serves under the key (including after an encoder reconnect), so a
		// duplicate would only overwrite the running job's storage output
		if (this.runningKeys.has(message.streamKey)) {
			this.logger.warn(`live job for ${message.streamKey} already running — duplicate dropped`);
			return;
		}
		while (this.runningCount >= this.maxConcurrent) {
			await new Promise<void>((resolve) => this.waiters.push(resolve));
		}
		this.runningKeys.add(message.streamKey);
		this.runningCount += 1;
		try {
			await this.runLiveJob(message);
		} finally {
			this.runningKeys.delete(message.streamKey);
			this.runningCount -= 1;
			this.waiters.shift()?.();
		}
	}

	private async runLiveJob(message: LiveProcessMsg) {
		// unique per job: an encoder reconnect queues a second job for the same
		// stream — a shared dir made the jobs corrupt each other's final sweep
		const dedicatedDir = join(this.videoFilesDir, `${message.streamKey}-${Date.now()}`);

		try {
			mkdirSync(dedicatedDir, { recursive: true });

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
						await this.videoProcessService.processLiveVideo(rtmpUrl, dedicatedDir);
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

			// best effort: flush whatever was produced so the partial stream is playable
			try {
				const uploader = new LiveUploader(
					dedicatedDir,
					message.id.toString(),
					this.minioClientService.client,
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

	private async removeDirectory(dir: string) {
		await rm(dir, { recursive: true, force: true });
	}
}
