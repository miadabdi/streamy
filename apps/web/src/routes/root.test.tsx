import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

	it('links the switch-channel button to the settings switcher, ships no demo subscriptions', () => {
		renderWithApp(<AppRoutes />);

		expect(screen.getByRole('link', { name: 'Switch channel' })).toHaveAttribute(
			'href',
			'/settings#channels',
		);
		// no endpoint lists subscriptions yet — the section stays honestly empty
		expect(screen.queryByText('longwave')).not.toBeInTheDocument();
		expect(screen.queryByText('selfhost.cafe')).not.toBeInTheDocument();
	});

	it('drops the sidenav on /watch/:id', () => {
		renderWithApp(<AppRoutes />, { route: '/watch/dQw4w9WgXcQ' });

		expect(screen.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument();
		expect(screen.queryByText('current channel')).not.toBeInTheDocument();
		// slug route param: unresolvable by the numeric-only public endpoint →
		// the 404 card, which still proves the Watch route rendered
		expect(screen.getByText('No such video.')).toBeInTheDocument();
	});

	it('marks viewer pages roomy and studio pages dense', () => {
		const { unmount } = renderWithApp(<AppRoutes />, { route: '/search' });
		expect(document.querySelector('.app-page')).toHaveAttribute('data-density', 'roomy');
		unmount();

		renderWithApp(<AppRoutes />, { route: '/settings' });
		expect(document.querySelector('.app-page')).not.toHaveAttribute('data-density');
	});

	it('gates /ops content behind admin — non-admins get the honest state', async () => {
		renderWithApp(<AppRoutes />, { route: '/ops' });

		expect(await screen.findByText('Admins only')).toBeInTheDocument();
	});

	it('links the topbar actions to studio upload and go-live', () => {
		renderWithApp(<AppRoutes />);

		expect(screen.getByRole('link', { name: 'Upload' })).toHaveAttribute('href', '/studio/upload');
		expect(screen.getByRole('link', { name: 'Go live' })).toHaveAttribute('href', '/studio/go-live');
	});

	it('submits the topbar search to /search with the query seeding the page input', async () => {
		const user = userEvent.setup();
		renderWithApp(<AppRoutes />);

		await user.type(screen.getByLabelText('Search videos'), 'rack{Enter}');

		// landed on /search: the page's own input is seeded from ?q=
		expect(await screen.findByRole('heading', { name: 'Search' })).toBeInTheDocument();
		expect(document.querySelector('.app-page input')).toHaveValue('rack');
	});

	it('opens the sidenav drawer on the menu toggle and closes it on Escape', async () => {
		const user = userEvent.setup();
		renderWithApp(<AppRoutes />);
		const side = document.querySelector<HTMLElement>('.app-side')!;

		expect(side).not.toHaveAttribute('data-open');
		const toggle = screen.getByRole('button', { name: 'Navigation menu' });
		await user.click(toggle);
		expect(side).toHaveAttribute('data-open', '');
		expect(toggle).toHaveAttribute('aria-expanded', 'true');

		await user.keyboard('{Escape}');
		expect(side).not.toHaveAttribute('data-open');
	});

	it('closes the drawer when a navigation happens from it', async () => {
		const user = userEvent.setup();
		renderWithApp(<AppRoutes />);
		const side = document.querySelector<HTMLElement>('.app-side')!;

		await user.click(screen.getByRole('button', { name: 'Navigation menu' }));
		await user.click(screen.getByRole('link', { name: 'Search' }));

		expect(side).not.toHaveAttribute('data-open');
	});
});
