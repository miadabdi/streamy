import { QueryClient } from '@tanstack/react-query';

/** App-wide query defaults: data is fresh for 30s, one retry on failure. */
export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { staleTime: 30_000, retry: 1 },
		},
	});
}
