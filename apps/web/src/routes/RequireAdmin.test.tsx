import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/render';
import { RequireAdmin } from './RequireAdmin';

function NextProbe() {
	const location = useLocation();
	return <p>next={(location.state as { next?: string } | null)?.next}</p>;
}

function Gated() {
	return (
		<Routes>
			<Route element={<RequireAdmin />}>
				<Route path="/ops" element={<p>admin content</p>} />
			</Route>
			<Route path="/signin" element={<NextProbe />} />
		</Routes>
	);
}

describe('RequireAdmin', () => {
	it('renders children when the session user is an admin', () => {
		renderWithApp(<Gated />, { route: '/ops', me: { isAdmin: true } });

		expect(screen.getByText('admin content')).toBeInTheDocument();
	});

	it('shows non-admins an honest admins-only state instead of redirecting', () => {
		renderWithApp(<Gated />, { route: '/ops' });

		expect(screen.getByText('Admins only')).toBeInTheDocument();
		expect(screen.queryByText('admin content')).not.toBeInTheDocument();
		// a redirect would have landed on the signin probe
		expect(screen.queryByText(/^next=/)).not.toBeInTheDocument();
	});

	it('shows a loading state while the session probe is pending', () => {
		renderWithApp(<Gated />, { route: '/ops', session: 'loading' });

		expect(screen.getByText('Loading…')).toBeInTheDocument();
		expect(screen.queryByText('admin content')).not.toBeInTheDocument();
	});

	it('sends an anonymous session to /signin carrying the location as next', () => {
		renderWithApp(<Gated />, { route: '/ops', session: 'anonymous' });

		expect(screen.getByText('next=/ops')).toBeInTheDocument();
		expect(screen.queryByText('Admins only')).not.toBeInTheDocument();
	});
});
