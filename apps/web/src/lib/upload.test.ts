import { afterEach, describe, expect, it, vi } from 'vitest';
import { putToPresignedUrl } from './upload';

// jsdom never fires real upload progress (msw intercepts XHR), so the XHR is
// faked here: the test drives upload.onprogress / onload / onerror by hand.
class FakeXHR {
	static instances: FakeXHR[] = [];

	upload: {
		onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null;
	} = {
		onprogress: null,
	};
	withCredentials = true;
	aborted = false;
	status = 0;
	method = '';
	url = '';
	headers: Record<string, string> = {};
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;
	onabort: (() => void) | null = null;

	constructor() {
		FakeXHR.instances.push(this);
	}

	open(method: string, url: string) {
		this.method = method;
		this.url = url;
	}

	setRequestHeader(key: string, value: string) {
		this.headers[key] = value;
	}

	send() {}

	abort() {
		this.aborted = true;
		this.onabort?.();
	}

	emitProgress(loaded: number, total: number) {
		this.upload.onprogress?.({ lengthComputable: true, loaded, total });
	}

	respond(status: number) {
		this.status = status;
		this.onload?.();
	}
}

const URL_ = 'http://storage.test/videos/11/night.mp4?X-Amz-Signature=sig';
const FILE = new File([new Uint8Array(3000)], 'night.mp4', { type: 'video/mp4' });

function lastXhr(): FakeXHR {
	return FakeXHR.instances.at(-1) as FakeXHR;
}

afterEach(() => {
	vi.unstubAllGlobals();
	FakeXHR.instances.length = 0;
});

describe('putToPresignedUrl', () => {
	it('PUTs the file to the absolute URL with the file content type and no credentials', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const done = putToPresignedUrl(URL_, FILE);

		const xhr = lastXhr();
		expect(xhr.method).toBe('PUT');
		expect(xhr.url).toBe(URL_);
		expect(xhr.headers['Content-Type']).toBe('video/mp4');
		// presigned storage must never receive the session cookie
		expect(xhr.withCredentials).toBe(false);

		xhr.respond(200);
		await expect(done).resolves.toBeUndefined();
	});

	it('defaults the content type when the file has none', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const done = putToPresignedUrl(URL_, new File([new Uint8Array(3)], 'blob.bin'));
		expect(lastXhr().headers['Content-Type']).toBe('application/octet-stream');
		lastXhr().respond(204);
		await expect(done).resolves.toBeUndefined();
	});

	it('streams upload progress events to the callback', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const seen: Array<{ loaded: number; total: number }> = [];
		const done = putToPresignedUrl(URL_, FILE, (loaded, total) => seen.push({ loaded, total }));

		const xhr = lastXhr();
		xhr.emitProgress(1500, 3000);
		xhr.emitProgress(3000, 3000);
		expect(seen).toEqual([
			{ loaded: 1500, total: 3000 },
			{ loaded: 3000, total: 3000 },
		]);

		xhr.respond(200);
		await expect(done).resolves.toBeUndefined();
	});

	it('rejects when storage answers non-2xx', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const done = putToPresignedUrl(URL_, FILE);
		lastXhr().respond(403);
		await expect(done).rejects.toThrow('403');
	});

	it('rejects on network error', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const done = putToPresignedUrl(URL_, FILE);
		lastXhr().onerror?.();
		await expect(done).rejects.toThrow('failed');
	});

	it('aborts the in-flight request when the signal fires', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const controller = new AbortController();
		const done = putToPresignedUrl(URL_, FILE, undefined, controller.signal);

		controller.abort();
		expect(lastXhr().aborted).toBe(true);
		await expect(done).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('rejects immediately when the signal was already aborted', async () => {
		vi.stubGlobal('XMLHttpRequest', FakeXHR);
		const controller = new AbortController();
		controller.abort();
		await expect(putToPresignedUrl(URL_, FILE, undefined, controller.signal)).rejects.toMatchObject(
			{
				name: 'AbortError',
			},
		);
	});
});
