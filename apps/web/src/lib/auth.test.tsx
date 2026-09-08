import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeMe } from '../test/fixtures';
import { server } from '../test/server';
import { useForgotPassword, useMe, useResetPassword, useSignIn, useSignOut, useSignUp } from './auth';

let queryClient: QueryClient;

function Wrapper({ children }: { children: ReactNode }) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// MSW/respond-with-JSON shape: fixture Dates become ISO strings on the wire.
const wireMe = () => JSON.parse(JSON.stringify(makeMe())) as unknown as ReturnType<typeof makeMe>;

beforeEach(() => {
	queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 5_000 } },
	});
});

describe('useMe', () => {
	it('serves the session user from GET /user/me', async () => {
		const { result } = renderHook(() => useMe(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.data).toEqual(wireMe()));
	});

	it('maps a 401 to an anonymous (null) session, not an error', async () => {
		server.use(
			http.get('/api/v1/user/me', () =>
				HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }),
			),
		);

		const { result } = renderHook(() => useMe(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.data).toBeNull());
		expect(result.current.error).toBeNull();
	});
});

describe('useSignIn', () => {
	it('POSTs credentials to /auth/signin and refetches [me]', async () => {
		queryClient.setQueryData(['me'], null);
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/signin', async ({ request }) => {
				body = await request.json();
				return new HttpResponse(null, { status: 200 });
			}),
		);

		const me = renderHook(() => useMe(), { wrapper: Wrapper });
		const signIn = renderHook(() => useSignIn(), { wrapper: Wrapper });
		await waitFor(() => expect(me.result.current.data).toBeNull());

		await signIn.result.current.mutateAsync({ email: 'user@example.com', password: 'password123' });

		expect(body).toEqual({ email: 'user@example.com', password: 'password123' });
		await waitFor(() => expect(me.result.current.data).toEqual(wireMe()));
	});
});

describe('useSignUp', () => {
	it('POSTs the nested channel payload to /auth/signup', async () => {
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/signup', async ({ request }) => {
				body = await request.json();
				return HttpResponse.json(makeMe(), { status: 201 });
			}),
		);

		const { result } = renderHook(() => useSignUp(), { wrapper: Wrapper });
		const user = await result.current.mutateAsync({
			email: 'new@example.com',
			password: 'password123',
			channel: {
				username: 'nightwatch',
				name: 'Night Watch',
				description: 'A channel for the small hours',
			},
		});

		expect(body).toEqual({
			email: 'new@example.com',
			password: 'password123',
			channel: {
				username: 'nightwatch',
				name: 'Night Watch',
				description: 'A channel for the small hours',
			},
		});
		expect(user).toEqual(wireMe());
	});
});

describe('useSignOut', () => {
	it('POSTs /auth/signout and clears the whole query cache', async () => {
		queryClient.setQueryData(['me'], makeMe());
		queryClient.setQueryData(['other'], { x: 1 });
		let called = false;
		server.use(
			http.post('/api/v1/auth/signout', () => {
				called = true;
				return new HttpResponse(null, { status: 200 });
			}),
		);

		const { result } = renderHook(() => useSignOut(), { wrapper: Wrapper });
		await result.current.mutateAsync();

		expect(called).toBe(true);
		expect(queryClient.getQueryData(['me'])).toBeUndefined();
		expect(queryClient.getQueryData(['other'])).toBeUndefined();
	});
});

describe('useForgotPassword', () => {
	it('POSTs { email } to /auth/forgot-password and returns { message }', async () => {
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/forgot-password', async ({ request }) => {
				body = await request.json();
				return HttpResponse.json({ message: 'Reset Email Sent' });
			}),
		);

		const { result } = renderHook(() => useForgotPassword(), { wrapper: Wrapper });
		const res = await result.current.mutateAsync({ email: 'user@example.com' });

		expect(body).toEqual({ email: 'user@example.com' });
		expect(res.message).toBe('Reset Email Sent');
	});
});

describe('useResetPassword', () => {
	it('POSTs email/password/token to /auth/reset-password', async () => {
		const token = 'a'.repeat(64);
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/reset-password', async ({ request }) => {
				body = await request.json();
				return HttpResponse.json({ message: 'Password Changed Successfully' });
			}),
		);

		const { result } = renderHook(() => useResetPassword(), { wrapper: Wrapper });
		await result.current.mutateAsync({ email: 'user@example.com', password: 'password123', token });

		expect(body).toEqual({ email: 'user@example.com', password: 'password123', token });
	});
});
