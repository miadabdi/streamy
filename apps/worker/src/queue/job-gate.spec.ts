import { describe, expect, it, vi } from 'vitest';
import { JobGate } from './job-gate';

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((r) => (resolve = r));
	return { promise, resolve };
}

describe('JobGate', () => {
	it('reports capacity while below max and fires onRelease when a job finishes', async () => {
		const gate = new JobGate(2);
		const a = deferred();
		const b = deferred();
		const released = vi.fn();
		gate.onRelease(released);

		expect(gate.hasCapacity).toBe(true);
		expect(gate.start('a', () => a.promise)).toBe(true);
		expect(gate.start('b', () => b.promise)).toBe(true);
		expect(gate.hasCapacity).toBe(false); // both slots held
		expect(released).not.toHaveBeenCalled();

		a.resolve();
		await vi.waitUntil(() => released.mock.calls.length > 0);
		expect(gate.hasCapacity).toBe(true);
		b.resolve();
	});

	it('rejects a duplicate key while the first job runs', async () => {
		const gate = new JobGate(2);
		const job = deferred();
		expect(gate.start('same', () => job.promise)).toBe(true);
		expect(gate.has('same')).toBe(true);
		expect(gate.start('same', async () => 'never')).toBe(false);
		job.resolve();
		await vi.waitUntil(() => !gate.has('same'));
	});

	it('frees the key after completion so it can start again', async () => {
		const gate = new JobGate(1);
		const first = deferred();
		gate.start('k', () => first.promise);
		first.resolve();
		await vi.waitUntil(() => !gate.has('k'));
		expect(gate.start('k', async () => 2)).toBe(true);
	});
});
