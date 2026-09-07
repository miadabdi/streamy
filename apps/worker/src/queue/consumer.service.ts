import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import * as amqplib from 'amqplib';
import {
	DEAD_LETTER_QUEUE,
	DLX_EXCHANGE,
	RMQ_QUEUES,
	RMQ_QUEUES_TYPE,
} from '@miadabdi/streamy-queues';

@Injectable()
export class ConsumerService {
	private logger = new Logger(ConsumerService.name);
	private connection: AmqpConnectionManager;
	private channelWrapper: ChannelWrapper;
	private listeners = new Map<RMQ_QUEUES_TYPE, (content: any) => Promise<any>>();

	constructor(private configService: ConfigService) {
		const amqpConnectionString = this.configService.get<string>('RMQ_URL');

		this.connection = amqp.connect([amqpConnectionString]);
		this.channelWrapper = this.connection.createChannel({
			setup: async (channel: amqplib.ConfirmChannel) => {
				// re-runs on every reconnect: re-assert queues with dead-letter args
				for (const [queue] of this.listeners) {
					await this.assertQueue(channel, queue);
				}
			},
		});
	}

	/**
	 * This method sets a callback as message handler of a specific queue
	 * @param {RMQ_QUEUES_TYPE} queue name of queue
	 * @param {(content: any) => Promise<any>} callback
	 */
	async listenOnQueue(queue: RMQ_QUEUES_TYPE, callback: (content: any) => Promise<any>) {
		this.logger.log(`Setup consumer for queue ${queue}`);
		this.listeners.set(queue, callback);
		await this.channelWrapper.addSetup(async (channel: amqplib.ConfirmChannel) => {
			await this.assertQueue(channel, queue);
		});
		// wrapper.consume re-establishes the subscription on reconnects
		await this.channelWrapper.consume(
			queue,
			(message) => {
				this.handleMessage(queue, callback, message);
			},
			{
				prefetch: 1,
			},
		);
		this.logger.log(`Consumer service started and listening on ${queue} for messages`);
	}

	private async assertQueue(channel: amqplib.ConfirmChannel, queue: RMQ_QUEUES_TYPE) {
		await channel.assertQueue(queue, {
			durable: true,
			arguments: { 'x-dead-letter-exchange': DLX_EXCHANGE },
		});
	}

	private async handleMessage(
		queue: RMQ_QUEUES_TYPE,
		callback: (content: any) => Promise<any>,
		message: amqplib.Message | null,
	) {
		if (!message) return;

		try {
			const content = JSON.parse(message.content.toString());
			this.logger.verbose(`Received message from ${queue}: ${message.content}`);

			await callback(content);

			await this.channelWrapper.ack(message);
		} catch (err) {
			this.logger.error(`Error on consuming queue ${queue}, dead-lettering message`);
			this.logger.error(err);
			await this.channelWrapper.nack(message, false, false);
		}
	}

	isConnected(): boolean {
		return this.connection?.isConnected() ?? false;
	}
}
