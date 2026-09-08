import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/render';
import { RequireAuth } from './RequireAuth';

function NextProbe() {
	const location = useLocation();
	return <p>next={(location.state as { next?: string } | null)?.next}</p>;
}

function Gated() {
	return (
		<Routes>
			<Route element={<RequireAuth />}>
				<Route path="/studio/videos" element={<p>studio content</p>} />
			</Route>
			<Route path="/signin" element={<NextProbe />} />
		</Routes>
	);
}

describe('RequireAuth', () => {
	it('renders children when the session user is present', () => {
		renderWithApp(<Gated />, { route: '/studio/videos' });

		expect(screen.getByText('studio content')).toBeInTheDocument();
	});

	it('redirects anonymous users to /signin carrying the current location as next', () => {
		renderWithApp(<Gated />, { route: '/studio/videos', session: 'anonymous' });

		expect(screen.getByText('next=/studio/videos')).toBeInTheDocument();
		expect(screen.queryByText('studio content')).not.toBeInTheDocument();
	});

	it('shows a loading state while the session probe is pending', () => {
		renderWithApp(<Gated />, { route: '/studio/videos', session: 'loading' });

		expect(screen.getByText('Loading…')).toBeInTheDocument();
		expect(screen.queryByText('studio content')).not.toBeInTheDocument();
	});
});
