/**
 * in-process concurrency gate for pulled queue jobs: at most `max` run at
 * once, and a key that is running (or queued behind the gate) marks later
 * arrivals as duplicates — a replayed message for work this process already
 * owns can only corrupt its output.
 */
export class JobGate {
	private keys = new Set<string>();
	private running = 0;
	private releaseListeners: Array<() => void> = [];

	constructor(private readonly max: number) {}

	get hasCapacity(): boolean {
		return this.running < this.max;
	}

	/** a job with this key is in flight (running or waiting to be started) */
	has(key: string): boolean {
		return this.keys.has(key);
	}

	/**
	 * starts the job immediately — callers must have checked `hasCapacity`.
	 * @returns false when a job with this key is already in flight (duplicate)
	 */
	start(key: string, job: () => Promise<unknown>): boolean {
		if (this.keys.has(key)) return false;
		this.keys.add(key);
		this.running += 1;
		void (async () => {
			try {
				await job();
			} finally {
				this.running -= 1;
				this.keys.delete(key);
				for (const listener of this.releaseListeners.splice(0)) listener();
			}
		})();
		return true;
	}

	/** fires whenever a job finishes and a slot opens up */
	onRelease(listener: () => void): void {
		this.releaseListeners.push(listener);
	}
}
