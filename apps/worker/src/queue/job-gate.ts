/**
 * in-process concurrency gate for queue jobs whose messages are acked on
 * receipt (so rabbitmq's prefetch cannot bound them): at most `max` jobs run
 * concurrently, extras wait in a FIFO, and a job whose key is already running
 * OR WAITING is dropped as a duplicate (a redelivered/replayed message for
 * work this process already owns can only corrupt its output).
 *
 * keys are tracked from entry — including while waiting — so a duplicate is
 * caught even before the first copy starts running.
 */
export class JobGate {
	private keys = new Set<string>();
	private running = 0;
	private waiters: Array<() => void> = [];

	constructor(private readonly max: number) {}

	/**
	 * @returns the job's result, or `undefined` when a job with this key is
	 * already in flight (duplicate dropped)
	 */
	async run<T>(key: string, job: () => Promise<T>): Promise<T | undefined> {
		if (this.keys.has(key)) return undefined;
		this.keys.add(key);
		try {
			while (this.running >= this.max) {
				await new Promise<void>((resolve) => this.waiters.push(resolve));
			}
			this.running += 1;
			try {
				return await job();
			} finally {
				this.running -= 1;
				this.waiters.shift()?.();
			}
		} finally {
			this.keys.delete(key);
		}
	}
}
