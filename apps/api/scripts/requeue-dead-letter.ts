/**
 * Replays dead-lettered messages back to their original queue.
 *
 * A message lands on q.dead_letter when its handler threw (dead-lettered
 * via the dlx fanout). Each dead-lettered message carries x-death headers
 * naming the queue it came from; this script moves every message back
 * there and acks it on the dead-letter queue.
 *
 * Usage: npm run requeue:dead-letter   (requires the stack running)
 */

import { existsSync, readFileSync } from 'fs';
import * as amqplib from 'amqplib';

const env = Object.fromEntries(
	readFileSync(existsSync('.env') ? '.env' : '../../.env', 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trim().startsWith('#'))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);

// expand ${VAR} references the way dotenv would
const expand = (value: string) => value.replace(/\$\{(\w+)\}/g, (_, name) => env[name] ?? '');

const RMQ_URL = expand(env.RMQ_URL ?? 'amqp://localhost:5672');

async function main() {
	const connection = await amqplib.connect(RMQ_URL);
	const channel = await connection.createChannel();

	let moved = 0;
	for (;;) {
		const message = await channel.get('q.dead_letter', { noAck: false });
		if (!message) break;

		const deaths = message.properties.headers?.['x-death'] as
			Array<{ queue?: string; 'original-expiration'?: number }> | undefined;
		const originalQueue = deaths?.[0]?.queue;

		if (!originalQueue) {
			console.warn('  skipping message without x-death header (publish nowhere to return it to)');
			channel.ack(message);
			continue;
		}

		const expired = deaths?.[0]?.['original-expiration'] != null;
		if (expired) delete message.properties.expiration;

		channel.publish('', originalQueue, message.content, {
			persistent: true,
			headers: { 'x-requeued-from-dead-letter': new Date().toISOString() },
		});
		channel.ack(message);
		moved++;
		console.log(`  requeued -> ${originalQueue}`);
	}

	console.log(`done: ${moved} message(s) requeued`);
	await channel.close();
	await connection.close();
}

main().catch((err) => {
	console.error('requeue failed:', err.message);
	process.exit(1);
});
