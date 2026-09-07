import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, ChannelWrapper } from 'amqp-connection-manager';
import {
	DEAD_LETTER_QUEUE,
	DLX_EXCHANGE,
	RMQ_QUEUES,
	RMQ_QUEUES_TYPE,
} from '@miadabdi/streamy-queues';

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
				// shared dead-letter exchange catching nacked messages from all queues
				await channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });
				await channel.assertQueue(DEAD_LETTER_QUEUE, { durable: true });
				await channel.bindQueue(DEAD_LETTER_QUEUE, DLX_EXCHANGE, '');

				for (const queue of RMQ_QUEUES) {
					this.logger.log(`Asserting queue ${queue}`);
					await channel.assertQueue(queue, {
						durable: true,
						arguments: { 'x-dead-letter-exchange': DLX_EXCHANGE },
					});
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
