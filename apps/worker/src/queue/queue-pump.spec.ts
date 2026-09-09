import { describe, expect, it, vi } from 'vitest';
import { JobGate } from './job-gate';
import { createQueuePump } from './queue-pump';

function messageOf(content: unknown) {
	return { content: Buffer.from(JSON.stringify(content)) };
}

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
}

function makeQueue(messages: Array<{ content: Buffer } | null>) {
	return async () => messages.shift() ?? null;
}

describe('createQueuePump', () => {
	it('takes only as many messages as the gate has capacity; the rest stay queued', async () => {
		const gate = new JobGate(2);
		const jobs = new Map<number, ReturnType<typeof deferred>>();
		const taken: number[] = [];
		const queue = [messageOf({ id: 1 }), messageOf({ id: 2 }), messageOf({ id: 3 })];
		const acked: unknown[] = [];

		const { pump } = createQueuePump(
			{ get: makeQueue(queue), ack: (m) => acked.push(m), warn: vi.fn() },
			{
				gate,
				keyOf: (c: { id: number }) => String(c.id),
				duplicateLabel: 'vod job',
				run: (c: { id: number }) => {
					taken.push(c.id);
					const d = deferred();
					jobs.set(c.id, d);
					return d.promise;
				},
			},
		);
		await pump();

		expect(taken).toEqual([1, 2]);
		expect(acked).toHaveLength(2);
		expect(queue).toHaveLength(1); // id 3 never left the queue

		// a finished job pumps again — exactly one more is taken
		jobs.get(1)!.resolve();
		await vi.waitUntil(() => taken.includes(3));
		expect(taken).toEqual([1, 2, 3]);
		jobs.get(2)!.resolve();
		jobs.get(3)!.resolve();
	});

	it('acks and drops a duplicate key while the first copy still runs', async () => {
		const gate = new JobGate(2);
		const job = deferred();
		const run = vi.fn(() => job.promise);
		const warn = vi.fn();
		const queue = [messageOf({ id: 7 }), messageOf({ id: 7 })];

		const { pump } = createQueuePump(
			{ get: makeQueue(queue), ack: vi.fn(), warn },
			{
				gate,
				keyOf: (c: { id: number }) => String(c.id),
				duplicateLabel: 'vod job',
				run,
			},
		);
		await pump();

		// both messages were taken (two slots), but only the first ran
		expect(run).toHaveBeenCalledTimes(1);
		expect(queue).toHaveLength(0);
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate dropped'));

		job.resolve();
	});

	it('stops querying when the queue is empty', async () => {
		const gate = new JobGate(3);
		const get = vi.fn(async () => null);
		const { pump } = createQueuePump(
			{ get, ack: vi.fn(), warn: vi.fn() },
			{
				gate,
				keyOf: () => 'k',
				duplicateLabel: 'x',
				run: vi.fn(() => Promise.resolve()),
			},
		);
		await pump();
		expect(get).toHaveBeenCalledTimes(1);
	});
});
