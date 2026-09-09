import { Navigate, Outlet, useLocation } from 'react-router';
import { FailedIcon } from '../components/icons';
import { useMe } from '../lib/auth';

/**
 * Content gate for instance-wide routes (/ops). Non-admins keep the sidenav
 * link but get an honest admins-only state here — never a redirect loop.
 * Sits under RequireAuth in the router, so me is resolved by the time this
 * renders; the signin fallback only matters if it is ever mounted standalone.
 */
export function RequireAdmin() {
	const { data: me, isPending, isFetching } = useMe();
	const { pathname, search } = useLocation();

	// same pending window as RequireAuth: null is only a confirmed anonymous
	// session once no refetch is in flight
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

	if (me.isAdmin !== true) {
		return (
			<div className="empty">
				<FailedIcon className="empty-mark" width={30} height={30} aria-hidden />
				<h4>Admins only</h4>
				<p>
					This console manages the whole instance. Ask an existing admin to promote your
					account if you need access.
				</p>
			</div>
		);
	}

	return <Outlet />;
}
