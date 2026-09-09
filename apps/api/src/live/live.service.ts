import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { videoTypeEnum } from '../drizzle/schema';
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
	 * it would send live info to process queue
	 * @param {string} app
	 * @param {string} streamKey
	 * @returns {{ message: string }}
	 */
	async sendLiveToProcessQueue(app: string, streamKey: string): Promise<{ message: string }> {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: and(eq(schema.videos.type, videoTypeEnum.live), eq(schema.videos.videoId, streamKey)),
		});

		if (!video) {
			throw new NotFoundException(`Live video with stream key ${streamKey} not found`);
		}

		if (video.processingStatus != schema.VideoProccessingStatusEnum.ready_for_processing) {
			throw new BadRequestException(
				`Video is not in ready_for_processing state, current state: ${video.processingStatus}`,
			);
		}

		await this.sendLiveProcessRMQMsg({
			id: video.id,
			videoId: video.videoId,
			app,
			streamKey,
		});

		await this.drizzleService.db
			.update(schema.videos)
			.set({
				processingStatus: schema.VideoProccessingStatusEnum.processing,
			})
			.where(eq(schema.videos.id, video.id))
			.execute();

		return {
			message: 'Live sent to process queue successfully',
		};
	}

	async srsOnPublish(srsOnPublishDto: OnPublishDto) {
		// some encoders (obs with the full url in the server field) report the
		// app as "live/<stream-key>" — normalize so both split styles publish
		const app = srsOnPublishDto.app.split('/')[0];
		if (app != 'live') {
			throw new ForbiddenException('Only live app is allowed');
		}

		const data = await this.videoService.getLiveByVideoId(srsOnPublishDto.stream);

		if (!data) {
			throw new NotFoundException('Key not found');
		}

		await this.sendLiveToProcessQueue(srsOnPublishDto.app, srsOnPublishDto.stream);

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
			.set({ isActive: false })
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
