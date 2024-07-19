import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { RMQ_QUEUES_TYPE } from './queues';

@Injectable()
export class ConsumerService {
	private logger = new Logger(ConsumerService.name);
	private channelWrapper: ChannelWrapper;

	constructor(private configService: ConfigService) {
		const amqpConnectionString = this.configService.get<string>('RMQ_URL');

		const connection = amqp.connect([amqpConnectionString]);
		this.channelWrapper = connection.createChannel();
	}

	/**
	 * This method sets a callback as message handler of a specific queue
	 * @param {RMQ_QUEUES_TYPE} queue name of queue
	 * @param {(content: any) => Promise<any>} callback
	 */
	async listenOnQueue(queue: RMQ_QUEUES_TYPE, callback: (content: any) => Promise<any>) {
		try {
			this.logger.log(`Setup consumer for queue ${queue}`);
			await this.channelWrapper.consume(
				queue,
				async (message) => {
					if (message) {
						try {
							const content = JSON.parse(message.content.toString());
							this.logger.verbose(`Received message from ${queue}: ${message.content}`);

							await callback(content);

							this.channelWrapper.ack(message);
						} catch (err) {
							this.logger.error(`Error on consuming queue ${queue} `);
							this.logger.error(err);
						}
					}
				},
				{
					prefetch: 10,
				},
			);

			this.logger.log(`Consumer service started and listening on ${queue} for messages`);
		} catch (err) {
			console.log(err);
			this.logger.error(`Error starting the consumer on ${queue}: `, err);
		}
	}
}
