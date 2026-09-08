import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { Toaster } from 'sonner';

type RenderWithAppOptions = {
	route?: string;
};

export function renderWithApp(ui: ReactElement, { route = '/' }: RenderWithAppOptions = {}) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, gcTime: 5_000 } },
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={[route]}>
				{ui}
				<Toaster />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}
