import { isRouteErrorResponse, Link, useLocation, useNavigate, useRouteError } from 'react-router';

/**
 * Root-level errorElement: an unexpected failure while rendering a route.
 * Retry re-enters the route (react-router resets its error boundary when the
 * location object changes, so a transient crash gets one more chance); the
 * home link is the way out when retrying doesn't help.
 */
export function RouteError() {
	const error = useRouteError();
	const navigate = useNavigate();
	const location = useLocation();

	const status = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`.trim()
		: undefined;
	const detail = error instanceof Error ? error.message : undefined;

	return (
		<div className="empty" role="alert">
			<h4>Something broke</h4>
			<p>
				{status ? `${status} — ` : ''}An unexpected error stopped this page from rendering.
				Retry re-enters the page; if it keeps failing, head back to Browse.
			</p>
			{detail && (
				<p className="mono" style={{ fontSize: 11, margin: 0 }}>
					{detail}
				</p>
			)}
			<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
				<button
					className="btn btn-primary"
					type="button"
					onClick={() => navigate(location, { replace: true })}
				>
					Retry
				</button>
				<Link className="btn btn-secondary" to="/">
					Back to Browse
				</Link>
			</div>
		</div>
	);
}
