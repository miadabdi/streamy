import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEAD_LETTER_QUEUE } from '@miadabdi/streamy-queues';

/**
 * dead-letter visibility: asks the rabbitmq management api how many
 * messages sit on q.dead_letter, so /health/readiness can surface a
 * number instead of jobs silently disappearing
 */
@Injectable()
export class DeadLetterService {
	private logger = new Logger(DeadLetterService.name);

	constructor(private configService: ConfigService) {}

	async count(): Promise<number | null> {
		// amqp://user:pass@host:port — management api lives on the same host
		const url = this.configService.get<string>('RMQ_URL') ?? '';
		const match = url.match(/^amqps?:\/\/([^:]+):([^@]+)@([^:/:]+)/);
		if (!match) return null;

		const [, user, pass, host] = match;
		try {
			const res = await fetch(`http://${host}:15672/api/queues/%2F/${DEAD_LETTER_QUEUE}`, {
				headers: { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}` },
				signal: AbortSignal.timeout(3000),
			});
			if (!res.ok) return null;
			const body = (await res.json()) as { messages?: number };
			return body.messages ?? 0;
		} catch (err: any) {
			this.logger.warn(`dead letter count unavailable: ${err.message}`);
			return null;
		}
	}
}
