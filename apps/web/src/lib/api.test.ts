import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../test/server';
import { isPending } from '../types/api';
import { ApiError, api, setQueryClient } from './api';

let queryClient: QueryClient;

beforeEach(() => {
	// retry:false + short gcTime, or a missed MSW handler looks like a hang.
	queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 5_000 } },
	});
	setQueryClient(queryClient);
});

describe('api client', () => {
	it('unwraps JSON success bodies and sends cookies + JSON content-type', async () => {
		server.use(
			http.post('/api/v1/comment', async ({ request }) => {
				expect(request.credentials).toBe('include');
				expect(request.headers.get('content-type')).toBe('application/json');
				expect(await request.json()).toEqual({ content: 'hi', videoId: 1 });
				return HttpResponse.json({ id: 9, content: 'hi', videoId: 1 }, { status: 201 });
			}),
		);

		await expect(api.get('/api/v1/user/me')).resolves.toMatchObject({
			id: 1,
			email: 'user@example.com',
		});
		await expect(api.post('/api/v1/comment', { content: 'hi', videoId: 1 })).resolves.toMatchObject(
			{ id: 9 },
		);
	});

	it('throws ApiError with status and normalized message', async () => {
		server.use(
			http.get('/api/v1/video/by-id', () =>
				HttpResponse.json({ message: 'video not found' }, { status: 404 }),
			),
		);

		const err = await api.get('/api/v1/video/by-id?id=1').catch((e) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect(err).toMatchObject({ status: 404, message: 'video not found' });
	});

	it('joins string[] validation messages into one message', async () => {
		server.use(
			http.patch('/api/v1/user/update-me', () =>
				HttpResponse.json(
					{ message: ['email must be an email', 'firstName must be shorter'], statusCode: 400 },
					{ status: 400 },
				),
			),
		);

		const err = await api
			.patch('/api/v1/user/update-me', { email: 'nope' })
			.catch((e: unknown) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect((err as ApiError).message).toBe('email must be an email, firstName must be shorter');
	});

	it('on 401 writes null to [me] and rejects as ApiError', async () => {
		queryClient.setQueryData(['me'], { id: 7 });
		server.use(
			http.get('/api/v1/video/by-id', () =>
				HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
			),
		);

		const err = await api.get('/api/v1/video/by-id?id=1').catch((e) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect(err).toMatchObject({ status: 401, message: 'Unauthorized' });
		expect(queryClient.getQueryData(['me'])).toBeNull();
	});

	it('GET /user/me 401 does NOT write [me]', async () => {
		queryClient.setQueryData(['me'], { id: 7 });
		server.use(
			http.get('/api/v1/user/me', () =>
				HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
			),
		);

		await expect(api.get('/api/v1/user/me')).rejects.toBeInstanceOf(ApiError);
		expect(queryClient.getQueryData(['me'])).toEqual({ id: 7 });
	});
});

describe('isPending', () => {
	it('is true for the four pre-terminal states, false otherwise', () => {
		for (const status of [
			'ready_for_upload',
			'ready_for_processing',
			'waiting_in_queue',
			'processing',
		] as const) {
			expect(isPending(status)).toBe(true);
		}
		expect(isPending('done')).toBe(false);
		expect(isPending('failed_in_processing')).toBe(false);
		expect(isPending(null)).toBe(false);
	});
});
