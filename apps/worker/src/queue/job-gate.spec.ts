import { describe, expect, it, vi } from 'vitest';
import { JobGate } from './job-gate';

function deferred<T = void>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((r) => (resolve = r));
	return { promise, resolve };
}

describe('JobGate', () => {
	it('runs at most max jobs concurrently; extras wait in FIFO order', async () => {
		const gate = new JobGate(2);
		const order: string[] = [];
		const a = deferred();
		const b = deferred();
		const c = deferred();

		const jobA = gate.run('a', async () => {
			order.push('a:start');
			await a.promise;
			order.push('a:end');
		});
		const jobB = gate.run('b', async () => {
			order.push('b:start');
			await b.promise;
			order.push('b:end');
		});
		const jobC = gate.run('c', async () => {
			order.push('c:start');
			await c.promise;
			order.push('c:end');
		});
		await Promise.resolve(); // let a and b enter

		// c must not start while both slots are held
		expect(order).toEqual(['a:start', 'b:start']);

		a.resolve(); // frees a slot → c starts
		await vi.waitUntil(() => order.includes('c:start'));
		expect(order).toEqual(['a:start', 'b:start', 'a:end', 'c:start']);

		b.resolve();
		c.resolve();
		await Promise.all([jobA, jobB, jobC]);
		expect(order).toEqual(['a:start', 'b:start', 'a:end', 'c:start', 'b:end', 'c:end']);
	});

	it('drops a duplicate key even while the first copy is still waiting', async () => {
		const gate = new JobGate(1);
		const blocker = deferred();
		const first = gate.run('same', () => blocker.promise);

		// a second arrival for the same key while the first waits (not running)
		const second = await gate.run('same', async () => 'ran');
		expect(second).toBeUndefined();

		blocker.resolve();
		await first;
	});

	it('frees the key after completion so a later job may run', async () => {
		const gate = new JobGate(1);
		const first = await gate.run('k', async () => 1);
		const second = await gate.run('k', async () => 2);
		expect(first).toBe(1);
		expect(second).toBe(2);
	});
});
