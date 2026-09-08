import { screen } from '@testing-library/react';
import { useRoutes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from '../lib/router';
import { renderWithApp } from '../test/render';

// useRoutes over the same route objects the browser router consumes, so the
// MemoryRouter from renderWithApp drives which route renders.
function AppRoutes() {
	return useRoutes(routes);
}

describe('app shell', () => {
	it('renders the sidenav nav links and current-channel block at /', () => {
		renderWithApp(<AppRoutes />);

		for (const name of ['Home', 'Search', 'Studio', 'Playlists', 'Settings', 'Ops']) {
			expect(screen.getByRole('link', { name })).toBeInTheDocument();
		}
		expect(screen.getByText('Mia Doe')).toBeInTheDocument();
		expect(screen.getByText('current channel')).toBeInTheDocument();
	});

	it('drops the sidenav on /watch/:id', () => {
		renderWithApp(<AppRoutes />, { route: '/watch/dQw4w9WgXcQ' });

		expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
		expect(screen.queryByText('current channel')).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Watch' })).toBeInTheDocument();
	});

	it('marks viewer pages roomy and studio pages dense', () => {
		const { unmount } = renderWithApp(<AppRoutes />, { route: '/search' });
		expect(document.querySelector('.app-page')).toHaveAttribute('data-density', 'roomy');
		unmount();

		renderWithApp(<AppRoutes />, { route: '/settings' });
		expect(document.querySelector('.app-page')).not.toHaveAttribute('data-density');
	});
});
