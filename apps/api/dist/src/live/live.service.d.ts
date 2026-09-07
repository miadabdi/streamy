import { ConfigService } from '@nestjs/config';
import { DrizzleService } from '../drizzle/drizzle.service';
import { ProducerService } from '../queue/producer.service';
import { VideoService } from '../video/video.service';
import { OnPlayDto, OnPublishDto, OnStopDto, OnUnpublishDto } from './dto';
import { LiveProcessMsg } from './interface';
export declare class LiveService {
	private configService;
	private videoService;
	private drizzleService;
	private producerService;
	private logger;
	constructor(
		configService: ConfigService,
		videoService: VideoService,
		drizzleService: DrizzleService,
		producerService: ProducerService,
	);
	sendLiveProcessRMQMsg(payload: LiveProcessMsg): Promise<void>;
	sendLiveToProcessQueue(
		app: string,
		streamKey: string,
	): Promise<{
		message: string;
	}>;
	srsOnPublish(srsOnPublishDto: OnPublishDto): Promise<{
		code: number;
	}>;
	srsOnUnpublish(srsOnUnpublishDto: OnUnpublishDto): Promise<{
		code: number;
	}>;
	srsOnPlay(srsOnPlayDto: OnPlayDto): {
		code: number;
	};
	srsOnStop(srsOnStopDto: OnStopDto): {
		code: number;
	};
}
