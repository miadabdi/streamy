/**
 * Direct-to-storage upload: the ONLY absolute-URL request in the app. It must
 * bypass lib/api.ts entirely — no credentials, no JSON envelope — because the
 * target is presigned object storage, not the API (see e2e-vod.ts step 6).
 * XHR, not fetch, because upload progress needs xhr.upload.onprogress.
 */
export function putToPresignedUrl(
	url: string,
	file: Blob,
	onProgress?: (loaded: number, total: number) => void,
	signal?: AbortSignal,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('PUT', url);
		// the signature in the query string is the authorization; never send cookies
		xhr.withCredentials = false;
		xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) onProgress?.(event.loaded, event.total);
		};

		let settled = false;
		const onAbort = () => xhr.abort();
		const settle = (fn: () => void) => {
			if (settled) return;
			settled = true;
			signal?.removeEventListener('abort', onAbort);
			fn();
		};
		const abortError = () =>
			reject(Object.assign(new Error('Upload was aborted'), { name: 'AbortError' }));

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) settle(resolve);
			else settle(() => reject(new Error(`Storage rejected the upload (HTTP ${xhr.status})`)));
		};
		xhr.onerror = () => settle(() => reject(new Error('Upload to storage failed')));
		xhr.onabort = () => settle(abortError);

		signal?.addEventListener('abort', onAbort);
		if (signal?.aborted) {
			abortError();
			return;
		}
		xhr.send(file);
	});
}
