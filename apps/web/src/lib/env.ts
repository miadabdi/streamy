/**
 * Object storage is reached same-origin through the /storage proxy
 * (vite dev server → MinIO :9002; nginx fronts SeaweedFS the same way in
 * production). Always a relative path — an absolute :9002 URL would break
 * cross-origin and leak the internal port (plan risk #2).
 */
export function storageBase(): string {
	return '/storage';
}

declare global {
	interface Window {
		/** Runtime overrides injected by /env.js before the bundle loads. */
		__ENV__?: Partial<Record<'WORKER_API' | 'RTMP_HOST', string>>;
	}
}

/**
 * Runtime config lookup: window.__ENV__ (rendered from env.js.template by
 * the container entrypoint) wins, VITE_* build-time values are the dev
 * fallback. Empty strings count as unset so the defaults keep working.
 */
function runtimeEnv(key: 'WORKER_API' | 'RTMP_HOST'): string | undefined {
	const value = window.__ENV__?.[key] ?? import.meta.env[`VITE_${key}`];
	return value || undefined;
}

/**
 * Worker API base (health/readiness). The worker is a separate origin on
 * :3001, so dev proxies /worker-api through vite; nginx proxies it at the
 * same path in production (overridable via env.js / VITE_WORKER_API).
 */
export function workerApiBase(): string {
	return runtimeEnv('WORKER_API') ?? '/worker-api';
}

/**
 * RTMP ingest base for the Go live wizard (`rtmp://<host>/live`; the stream
 * key is appended as the path — `rtmp://host/live/<videoId>` is the full
 * ingest URL). Ingest is usually not the web origin, so production sets
 * WEB_RTMP_HOST (env.js) / VITE_RTMP_HOST; the fallback is the page host,
 * where the compose stack fronts SRS. Never hardcode the host.
 */
export function rtmpBase(): string {
	return `rtmp://${runtimeEnv('RTMP_HOST') || window.location.hostname}/live`;
}
