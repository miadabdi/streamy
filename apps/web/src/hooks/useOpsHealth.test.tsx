import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeReadiness } from '../test/fixtures';
import { server } from '../test/server';
import { useOpsHealth } from './useOpsHealth';

function Wrapper({ children }: { children: ReactNode }) {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

afterEach(() => {
	vi.useRealTimers();
});

describe('useOpsHealth', () => {
	it('fetches worker readiness through the /worker-api proxy', async () => {
		const readiness = makeReadiness({ activeJob: null });
		server.use(
			http.get('/worker-api/api/v1/health/readiness', () => HttpResponse.json(readiness)),
		);

		const { result } = renderHook(() => useOpsHealth(), { wrapper: Wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(readiness);
	});

	it('re-polls every 30 seconds', async () => {
		vi.useFakeTimers();
		let calls = 0;
		server.use(
			http.get('/worker-api/api/v1/health/readiness', () => {
				calls += 1;
				return HttpResponse.json(makeReadiness());
			}),
		);

		renderHook(() => useOpsHealth(), { wrapper: Wrapper });

		await act(async () => {
			await vi.advanceTimersByTimeAsync(10);
		});
		expect(calls).toBe(1);

		// 29 s: no second fetch yet
		await act(async () => {
			await vi.advanceTimersByTimeAsync(29_000);
		});
		expect(calls).toBe(1);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});
		expect(calls).toBe(2);
	});
});
