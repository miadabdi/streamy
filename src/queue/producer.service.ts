import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { RMQ_QUEUES, RMQ_QUEUES_TYPE } from '../common/constants';

@Injectable()
export class ProducerService implements OnModuleInit {
	private logger = new Logger(ProducerService.name);
	private channelWrapper: ChannelWrapper;

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		const amqpConnectionString = this.configService.get<string>('RMQ_URL');

		const connection = amqp.connect([amqpConnectionString]);
		this.channelWrapper = connection.createChannel({
			setup: async (channel: Channel) => {
				for (const queue of RMQ_QUEUES) {
					this.logger.log(`Asserting queue ${queue}`);
					await channel.assertQueue(queue, { durable: true });
				}
			},
		});
	}

	async addToQueue(queue: RMQ_QUEUES_TYPE, payload: any) {
		try {
			await this.channelWrapper.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
				persistent: true,
			});
			this.logger.log('Sent To Queue');
		} catch (error) {
			this.logger.error(error);
			throw new InternalServerErrorException(`Error adding to ${queue} queue`);
		}
	}
}
