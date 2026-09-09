import { screen } from '@testing-library/react';
import { useRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../lib/router';
import { renderWithApp } from '../test/render';

function AppRoutes() {
	return useRoutes(routes);
}

describe('NotFound', () => {
	it('renders a real 404 page inside the shell at an unknown route', () => {
		renderWithApp(<AppRoutes />, { route: '/definitely-not-a-page' });

		expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Browse' })).toHaveAttribute('href', '/');
		// the shell is still there — a wrong URL is not a broken app
		expect(screen.getByRole('link', { name: 'Streamy home' })).toBeInTheDocument();
	});
});
