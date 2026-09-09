import { Link } from 'react-router';
import { VodIcon } from '../components/icons';

/** Catch-all (`*`): a wrong URL is not a broken app — the shell stays. */
export function NotFound() {
	return (
		<div className="empty">
			<VodIcon className="empty-mark" width={32} height={32} aria-hidden />
			<h4>Page not found</h4>
			<p>There is nothing at this address — the link may be old, or it never existed.</p>
			<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
				<Link className="btn btn-primary" to="/">
					Back to Browse
				</Link>
			</div>
		</div>
	);
}
