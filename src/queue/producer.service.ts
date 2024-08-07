import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, ChannelWrapper } from 'amqp-connection-manager';
import { RMQ_QUEUES, RMQ_QUEUES_TYPE } from './queues';

@Injectable()
export class ProducerService {
	private logger = new Logger(ProducerService.name);
	private channelWrapper: ChannelWrapper;

	constructor(private configService: ConfigService) {
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

	/**
	 * sends a message to specific payload
	 * @param {RMQ_QUEUES_TYPE} queue name of queue
	 * @param {*} payload
	 */
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
