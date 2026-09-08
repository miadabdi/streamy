import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

// App owns routing now (RouterProvider), so it renders at the real jsdom URL
// instead of inside renderWithApp's MemoryRouter. useMe is a real query, so a
// QueryClientProvider (normally installed by main.tsx) must wrap it here too.
describe('App', () => {
	it('renders the STREAMY wordmark', () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

		render(
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>,
		);

		expect(screen.getByText('STREAMY')).toBeInTheDocument();
	});
});
