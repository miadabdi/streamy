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

		if (video.processingStatus != schema.VideoProccessingStatusEnum.ready_for_processing) {
			throw new BadRequestException(
				`Video is not in ready_for_processing state, current state: ${video.processingStatus}`,
			);
		}

		await this.sendLiveProcessRMQMsg({
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
		if (srsOnPublishDto.app != 'live') {
			throw new ForbiddenException('Only live app is allowed');
		}

		const data = await this.videoService.getLiveByVideoId(srsOnPublishDto.stream);

		if (data) {
			return { code: 0 };
		} else {
			return new NotFoundException('Key not found');
		}
	}

	srsOnUnpublish(srsOnUnpublishDto: OnUnpublishDto) {
		console.dir(srsOnUnpublishDto, { depth: null });
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
