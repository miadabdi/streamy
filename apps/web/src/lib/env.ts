/**
 * Object storage is reached same-origin through the /storage proxy
 * (vite dev server → MinIO :9002; the same path in production). Always a
 * relative path — an absolute :9002 URL would break cross-origin and
 * leak the internal port (plan risk #2).
 */
export function storageBase(): string {
	return '/storage';
}

/**
 * Worker API base (health/readiness). The worker is a separate origin on
 * :3001, so dev proxies /worker-api through vite; production either fronts
 * the worker at the same origin or sets VITE_WORKER_API to its base URL.
 */
export function workerApiBase(): string {
	const base = import.meta.env.VITE_WORKER_API as string | undefined;
	return base ?? '/worker-api';
}

/**
 * RTMP ingest base for the Go live wizard (`rtmp://<host>/live`; the stream
 * key is appended as the path — `rtmp://host/live/<videoId>` is the full
 * ingest URL). Ingest is usually not the web origin, so production sets
 * VITE_RTMP_HOST; dev falls back to the page host, where the compose stack
 * fronts SRS. Never hardcode the host.
 */
export function rtmpBase(): string {
	const host = import.meta.env.VITE_RTMP_HOST as string | undefined;
	return `rtmp://${host || window.location.hostname}/live`;
}
