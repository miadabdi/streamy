import { JobGate } from './job-gate';

/**
 * pull-model queue consumer: instead of subscribing (which with ack-on-receipt
 * would drain the whole queue into memory), the pump TAKES one message at a
 * time — only while the gate has capacity — and acks it on receipt. Anything
 * the worker cannot run right now stays queued in rabbitmq, durable across
 * worker restarts, and no message is ever unacked during processing.
 */
export interface QueuePumpDeps {
	/** basic.get — resolves null when the queue is empty */
	get: () => Promise<{ content: Buffer } | null>;
	ack: (message: unknown) => void;
	warn: (message: string) => void;
}

export interface QueuePumpOptions<T> {
	gate: JobGate;
	keyOf: (content: T) => string;
	duplicateLabel: string;
	run: (content: T) => Promise<unknown>;
}

export function createQueuePump<T>(deps: QueuePumpDeps, options: QueuePumpOptions<T>) {
	let pumping = false;

	async function pump(): Promise<void> {
		if (pumping) return;
		pumping = true;
		try {
			while (options.gate.hasCapacity) {
				const message = await deps.get();
				if (!message) break; // queue drained — wait for the next release/tick
				deps.ack(message);
				const content = JSON.parse(message.content.toString()) as T;
				const key = options.keyOf(content);
				if (options.gate.has(key)) {
					deps.warn(`${options.duplicateLabel} for ${key} already in flight — duplicate dropped`);
					continue;
				}
				options.gate.start(key, () => options.run(content));
			}
		} catch (err: any) {
			// transient: not-yet-connected at boot, or a reconnect window — the
			// interval/release pump retries
			deps.warn(`pump failed, will retry: ${err.message}`);
		} finally {
			pumping = false;
		}
	}

	options.gate.onRelease(() => void pump());

	return { pump };
}
