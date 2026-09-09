import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link, Outlet } from 'react-router';
import { Wordmark } from '../components/Wordmark';
import { UploadIcon } from '../components/icons';
import { useMe } from '../lib/auth';

// Watch drops the sidenav — the player owns the width (Nocturne readme, "App shell").
export function WatchLayout() {
	const { data: me } = useMe();
	const initials = me ? `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}` : '';

	return (
		<div className="app-col" data-density="roomy" style={{ minHeight: '100vh' }}>
			<header className="topbar" style={{ gap: 16 }}>
				<Link to="/" aria-label="Streamy home">
					<Wordmark />
				</Link>
				<label className="searchbar" style={{ flex: 1, maxWidth: 420, marginLeft: 12 }}>
					<MagnifyingGlass size={15} aria-hidden />
					<input type="search" placeholder="Search videos" aria-label="Search videos" />
				</label>
				<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
					<Link className="btn btn-secondary" to="/studio/upload">
						<UploadIcon width={15} height={15} aria-hidden /> Upload
					</Link>
					<span className="avatar">{initials}</span>
				</div>
			</header>
			{/* .watch-main (nocturne.css) so the small-screen breakpoint can widen it */}
			<main className="watch-main">
				<Outlet />
			</main>
		</div>
	);
}
