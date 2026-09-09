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
import { JobGate } from './job-gate';
import { createQueuePump } from './queue-pump';

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
	 * @param {{ ackOnReceipt?: boolean; concurrency?: number }} options
	 *   ackOnReceipt: ack before the callback runs — for handlers that
	 *   legitimately outlive any consumer_timeout (live transcodes run for the
	 *   whole broadcast). At-most-once: a crashed job is not redelivered.
	 *   concurrency: how many messages of this queue may run interleaved
	 *   (the consume handler is not awaited, so prefetch is the only bound;
	 *   each message still acks when its own job finishes).
	 */
	async listenOnQueue(
		queue: RMQ_QUEUES_TYPE,
		callback: (content: any) => Promise<any>,
		{
			ackOnReceipt = false,
			concurrency = 1,
		}: { ackOnReceipt?: boolean; concurrency?: number } = {},
	) {
		this.logger.log(`Setup consumer for queue ${queue}`);
		this.listeners.set(queue, callback);
		await this.channelWrapper.addSetup(async (channel: amqplib.ConfirmChannel) => {
			await this.assertQueue(channel, queue);
		});
		// wrapper.consume re-establishes the subscription on reconnects
		await this.channelWrapper.consume(
			queue,
			(message) => {
				if (ackOnReceipt && message) {
					this.channelWrapper.ack(message);
				}
				this.handleMessage(queue, callback, message, ackOnReceipt);
			},
			{
				prefetch: concurrency,
			},
		);
		// prefetch only bounds in-flight deliveries — for ack-on-receipt queues
		// (live) the real cap is the listener's in-process gate, not this number
		this.logger.log(
			`Consumer service started and listening on ${queue} for messages` +
				(ackOnReceipt ? '' : ` (concurrency ${concurrency})`),
		);
	}

	/**
	 * pull-model consumer for long jobs (transcodes): instead of subscribing —
	 * which with ack-on-receipt would drain the whole queue into worker memory —
	 * the pump basic.gets ONE message at a time, only while a slot is free, and
	 * acks it on receipt. Whatever the worker cannot run stays queued in
	 * rabbitmq (durable across restarts), and no message is ever unacked while
	 * a job runs, so no consumer_timeout can touch it.
	 *
	 * @param {RMQ_QUEUES_TYPE} queue name of queue
	 * @param {(content: any) => Promise<any>} run the job; errors are the
	 *   caller's business (the message is already settled by then)
	 * @param {{ concurrency?: number; keyOf?: (content: any) => string }} options
	 *   concurrency: simultaneous jobs (default 1)
	 *   keyOf: job identity — a message whose key is already in flight is
	 *   acked and dropped as a redundant duplicate
	 */
	async pollOnQueue(
		queue: RMQ_QUEUES_TYPE,
		run: (content: any) => Promise<unknown>,
		{
			concurrency = 1,
			keyOf,
			duplicateLabel = 'job',
		}: { concurrency?: number; keyOf?: (content: any) => string; duplicateLabel?: string } = {},
	) {
		this.logger.log(`Setup pull consumer for queue ${queue} (concurrency ${concurrency})`);
		this.listeners.set(queue, run);
		await this.channelWrapper.addSetup(async (channel: amqplib.ConfirmChannel) => {
			await this.assertQueue(channel, queue);
		});

		const gate = new JobGate(concurrency);
		const pump = createQueuePump(
			{
				// amqplib resolves `false` when the queue is empty — normalize to null
				get: async () => (await this.channelWrapper.get(queue, { noAck: false })) || null,
				ack: (message) => this.channelWrapper.ack(message as amqplib.Message),
				warn: (message) => this.logger.warn(message),
			},
			{
				gate,
				keyOf: keyOf ?? (() => `${queue}-${Date.now()}`),
				duplicateLabel,
				run: (content) => {
					this.logger.verbose(`Pulled message from ${queue}: ${JSON.stringify(content)}`);
					return run(content);
				},
			},
		);
		// not awaited: basic.get throws until the channel connects — the
		// interval keeps pumping and the first successful pass starts then
		void pump.pump();
		setInterval(() => void pump.pump(), 2000);
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
		alreadyAcked = false,
	) {
		if (!message) return;

		try {
			const content = JSON.parse(message.content.toString());
			this.logger.verbose(`Received message from ${queue}: ${message.content}`);

			await callback(content);

			if (!alreadyAcked) await this.channelWrapper.ack(message);
		} catch (err) {
			this.logger.error(`Error on consuming queue ${queue}, dead-lettering message`);
			this.logger.error(err);
			// ackOnReceipt messages are already settled — requeueing a dead
			// letter is wrong for them (the nack would target a settled tag)
			if (!alreadyAcked) await this.channelWrapper.nack(message, false, false);
		}
	}

	isConnected(): boolean {
		return this.connection?.isConnected() ?? false;
	}
}
