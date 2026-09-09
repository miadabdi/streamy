import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { http } from 'msw';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { Toaster } from 'sonner';
import type { Me } from '../types/api';
import { makeMe } from './fixtures';
import { server } from './server';

type RenderWithAppOptions = {
	route?: string;
	/**
	 * How ['me'] is seeded: 'user' (default, signed-in fixture), 'anonymous'
	 * (null), or 'loading' (probe never resolves, query stays pending).
	 */
	session?: 'user' | 'anonymous' | 'loading';
	/** Merged into the signed-in fixture (e.g. { isAdmin: true }). */
	me?: Partial<Me>;
};

export function renderWithApp(
	ui: ReactElement,
	{ route = '/', session = 'user', me }: RenderWithAppOptions = {},
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 5_000, staleTime: 30_000 } },
	});

	if (session === 'user') queryClient.setQueryData(['me'], makeMe(me));
	if (session === 'anonymous') queryClient.setQueryData(['me'], null);
	if (session === 'loading') {
		server.use(http.get('/api/v1/user/me', () => new Promise<Response>(() => {})));
	}

	const view = render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[route]}>
				{ui}
				<Toaster />
			</MemoryRouter>
		</QueryClientProvider>,
	);

	return { ...view, queryClient };
}
