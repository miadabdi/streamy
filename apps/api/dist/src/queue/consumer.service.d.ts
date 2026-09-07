import { ConfigService } from '@nestjs/config';
import { RMQ_QUEUES_TYPE } from './queues';
export declare class ConsumerService {
	private configService;
	private logger;
	private connection;
	private channelWrapper;
	private listeners;
	constructor(configService: ConfigService);
	listenOnQueue(queue: RMQ_QUEUES_TYPE, callback: (content: any) => Promise<any>): Promise<void>;
	private assertQueue;
	private handleMessage;
	isConnected(): boolean;
}
