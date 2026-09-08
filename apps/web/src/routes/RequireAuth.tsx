import { Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '../lib/auth';

export function RequireAuth() {
	const { data: me, isPending, isFetching } = useMe();
	const { pathname, search } = useLocation();

	// null is only a confirmed anonymous session once no refetch is in flight —
	// e.g. right after sign-in invalidated ['me'], the stale null must not
	// bounce the user back to /signin while the fresh fetch runs.
	if (isPending || (me === null && isFetching)) {
		return (
			<div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }} aria-busy="true">
				<span className="pill pill-processing">Loading…</span>
			</div>
		);
	}

	if (!me) {
		return <Navigate to="/signin" state={{ next: pathname + search }} replace />;
	}

	return <Outlet />;
}
