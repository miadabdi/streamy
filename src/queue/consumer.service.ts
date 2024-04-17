import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { RMQ_QUEUES_TYPE } from '../common/constants';

@Injectable()
export class ConsumerService implements OnModuleInit {
	private logger = new Logger(ConsumerService.name);
	private channelWrapper: ChannelWrapper;

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		const amqpConnectionString = this.configService.get<string>('RMQ_URL');

		const connection = amqp.connect([amqpConnectionString]);
		this.channelWrapper = connection.createChannel();
	}

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
			this.logger.error(`Error starting the consumer on ${queue}: `, err);
		}
	}
}
