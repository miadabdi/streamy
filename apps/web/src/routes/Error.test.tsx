import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../lib/router';
import { RouteError } from './Error';

// Throws on first render, succeeds after — proves retry re-enters the route
// instead of just re-rendering the error UI.
let broken = true;
function Flaky() {
	if (broken) throw new Error('kaboom during render');
	return <p>Recovered content</p>;
}

// errorElement catching only engages under a data router (react-router wraps
// matches in RenderErrorBoundary when dataRouterState exists) — the app uses
// createBrowserRouter, so the test uses its memory sibling. RouterProvider
// cannot nest inside renderWithApp's MemoryRouter, hence plain render().
function renderErrorApp() {
	const router = createMemoryRouter(
		[{ path: '/', element: <Flaky />, errorElement: <RouteError /> }],
		{ initialEntries: ['/'] },
	);
	return render(<RouterProvider router={router} />);
}

// The real watch/:id route with its layout swapped for a flaky one: the
// errorElement (and children) still come from the real router config, so
// removing the boundary there fails this test — errors bubble only to the
// nearest errorElement in the MATCHED chain, and the watch branch matches
// no ancestor boundary on its own.
function renderWatchCrash() {
	const testRoutes = routes.map((route) =>
		'path' in route && route.path === 'watch/:id' ? { ...route, element: <Flaky /> } : route,
	);
	const router = createMemoryRouter(testRoutes, { initialEntries: ['/watch/1'] });
	return render(<RouterProvider router={router} />);
}

describe('RouteError', () => {
	beforeEach(() => {
		broken = true;
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it('renders an honest message with retry and a way home', () => {
		renderErrorApp();

		expect(screen.getByRole('heading', { name: 'Something broke' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to Browse' })).toHaveAttribute('href', '/');
	});

	it('retry re-enters the route — a recovered element renders', async () => {
		const user = userEvent.setup();
		renderErrorApp();
		broken = false; // the crash was transient; retry should get a fresh render

		await user.click(screen.getByRole('button', { name: 'Retry' }));
		expect(screen.queryByRole('heading', { name: 'Something broke' })).not.toBeInTheDocument();
		expect(screen.getByText('Recovered content')).toBeInTheDocument();
	});

	it('covers the watch branch too — a crash there renders RouteError with retry', async () => {
		const user = userEvent.setup();
		renderWatchCrash();

		expect(screen.getByRole('heading', { name: 'Something broke' })).toBeInTheDocument();
		broken = false;
		await user.click(screen.getByRole('button', { name: 'Retry' }));
		expect(screen.getByText('Recovered content')).toBeInTheDocument();
	});
});
