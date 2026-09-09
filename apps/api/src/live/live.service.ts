import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { ProducerService } from '../queue/producer.service';
import { VideoService } from '../video/video.service';
import { OnPlayDto, OnPublishDto, OnStopDto, OnUnpublishDto } from './dto';
import { LiveProcessMsg } from './interface';

@Injectable()
export class LiveService {
	private logger = new Logger(LiveService.name);

	constructor(
		private configService: ConfigService,
		private videoService: VideoService,
		private drizzleService: DrizzleService,
		private producerService: ProducerService,
	) {}

	/**
	 * sending input message to `q.live.process` queue
	 * @param {LiveProcessMsg} payload
	 */
	async sendLiveProcessRMQMsg(payload: LiveProcessMsg) {
		await this.producerService.addToQueue('q.live.process', payload);
	}

	/**
	 * accepts a publish by the video's state:
	 * - ready_for_processing: fresh broadcast, enqueue the processing job
	 * - processing: republish while the worker is still running — the job
	 *   rides through short gaps, only restore the live flags
	 * - done/failed_in_processing inside the grace window: resume — the
	 *   conditional update makes a racing double-publish lose and skip the
	 *   enqueue
	 * @param {OnPublishDto} srsOnPublishDto
	 * @returns {{ code: number }}
	 */
	async srsOnPublish(srsOnPublishDto: OnPublishDto) {
		// some encoders (obs with the full url in the server field) report the
		// app as "live/<stream-key>" — normalize so both split styles publish
		const app = srsOnPublishDto.app.split('/')[0];
		if (app != 'live') {
			throw new ForbiddenException('Only live app is allowed');
		}

		const video = await this.videoService.getLiveByVideoId(srsOnPublishDto.stream);

		if (!video) {
			throw new NotFoundException('Key not found');
		}

		switch (video.processingStatus) {
			case schema.VideoProccessingStatusEnum.ready_for_processing: {
				await this.sendLiveProcessRMQMsg({
					id: video.id,
					videoId: video.videoId,
					app: srsOnPublishDto.app,
					streamKey: srsOnPublishDto.stream,
				});

				await this.drizzleService.db
					.update(schema.videos)
					.set({
						processingStatus: schema.VideoProccessingStatusEnum.processing,
						// start of the broadcast; kept on later resumes
						...(video.liveStartedAt ? {} : { liveStartedAt: new Date() }),
						isActive: true,
						disconnectedAt: null,
					})
					.where(eq(schema.videos.id, video.id))
					.execute();
				break;
			}

			case schema.VideoProccessingStatusEnum.processing:
				await this.drizzleService.db
					.update(schema.videos)
					.set({ isActive: true, disconnectedAt: null })
					.where(eq(schema.videos.id, video.id))
					.execute();
				break;

			case schema.VideoProccessingStatusEnum.done:
			case schema.VideoProccessingStatusEnum.failed_in_processing: {
				const resumed = await this.drizzleService.db
					.update(schema.videos)
					.set({
						processingStatus: schema.VideoProccessingStatusEnum.processing,
						isActive: true,
						disconnectedAt: null,
					})
					.where(
						and(
							eq(schema.videos.id, video.id),
							inArray(schema.videos.processingStatus, [
								schema.VideoProccessingStatusEnum.done,
								schema.VideoProccessingStatusEnum.failed_in_processing,
							]),
							gt(
								schema.videos.disconnectedAt,
								sql`now() - make_interval(secs => ${this.videoService.liveResumeGraceSeconds()})`,
							),
						),
					)
					.returning({ id: schema.videos.id })
					.execute();

				if (resumed.length == 0) {
					return { code: 0 };
				}

				await this.sendLiveProcessRMQMsg({
					id: video.id,
					videoId: video.videoId,
					app: srsOnPublishDto.app,
					streamKey: srsOnPublishDto.stream,
					resume: true,
				});
				break;
			}

			default:
				throw new BadRequestException(
					`Video is not in a publishable state, current state: ${video.processingStatus}`,
				);
		}

		return { code: 0 };
	}

	/**
	 * stream ended: mark the live video inactive so it stops matching
	 * future stream keys; the hls event playlist stays available as a replay
	 * @param {OnUnpublishDto} srsOnUnpublishDto
	 * @returns {{ code: number }}
	 */
	async srsOnUnpublish(srsOnUnpublishDto: OnUnpublishDto) {
		// same normalization as on_publish: obs-style "live/<key>" apps
		const app = srsOnUnpublishDto.app.split('/')[0];
		if (app != 'live') {
			throw new ForbiddenException('Only live app is allowed');
		}

		const video = await this.videoService.getLiveByVideoId(srsOnUnpublishDto.stream);

		if (!video) {
			throw new NotFoundException('Key not found');
		}

		await this.drizzleService.db
			.update(schema.videos)
			.set({ isActive: false, disconnectedAt: new Date() })
			.where(eq(schema.videos.id, video.id))
			.execute();

		return { code: 0 };
	}

	srsOnPlay(srsOnPlayDto: OnPlayDto) {
		console.dir(srsOnPlayDto, { depth: null });
		return { code: 0 };
	}

	srsOnStop(srsOnStopDto: OnStopDto) {
		console.dir(srsOnStopDto, { depth: null });
		return { code: 0 };
	}
}
