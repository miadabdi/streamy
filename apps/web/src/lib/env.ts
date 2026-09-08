/**
 * Object storage is reached same-origin through the /storage proxy
 * (vite dev server → MinIO :9002; the same path in production). Always a
 * relative path — an absolute :9002 URL would break cross-origin and
 * leak the internal port (plan risk #2).
 */
export function storageBase(): string {
	return '/storage';
}
