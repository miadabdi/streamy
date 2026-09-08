import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

// App owns routing now (RouterProvider), so it renders at the real jsdom URL
// instead of inside renderWithApp's MemoryRouter.
describe('App', () => {
	it('renders the STREAMY wordmark', () => {
		render(<App />);

		expect(screen.getByText('STREAMY')).toBeInTheDocument();
	});
});
