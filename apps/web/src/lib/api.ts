import type { QueryClient } from '@tanstack/react-query';

export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = 'ApiError';
	}
}

// Injected from main.tsx so 401s can flip ['me'] without a circular import.
let queryClient: QueryClient | undefined;
export function setQueryClient(client: QueryClient): void {
	queryClient = client;
}

type RequestOptions = Omit<RequestInit, 'body' | 'method'>;

async function request<T>(
	method: string,
	path: string,
	body?: unknown,
	opts: RequestOptions = {},
): Promise<T> {
	const res = await fetch(path, {
		...opts,
		method,
		credentials: 'include',
		headers: {
			...(body !== undefined && { 'Content-Type': 'application/json' }),
			...opts.headers,
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});

	if (!res.ok) {
		// The session probe owns its own anonymous-state transition (Task 6);
		// every other 401 means the session died → [me] becomes null.
		if (res.status === 401 && !(method === 'GET' && path === '/api/v1/user/me')) {
			queryClient?.setQueryData(['me'], null);
		}
		const data: { message?: string | string[] } = await res.json().catch(() => ({}));
		const message = Array.isArray(data.message)
			? data.message.join(', ')
			: (data.message ?? `Request failed with status ${res.status}`);
		throw new ApiError(res.status, message);
	}

	return (await res.json()) as T;
}

export const api = {
	get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
	post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
		request<T>('POST', path, body, opts),
	patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
		request<T>('PATCH', path, body, opts),
	del: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
};
