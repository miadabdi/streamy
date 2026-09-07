import { ConfigService } from '@nestjs/config';
import { RMQ_QUEUES_TYPE } from './queues';
export declare class ProducerService {
	private configService;
	private logger;
	private channelWrapper;
	constructor(configService: ConfigService);
	addToQueue(queue: RMQ_QUEUES_TYPE, payload: any): Promise<void>;
}
