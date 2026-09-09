import { List, MagnifyingGlass } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { Wordmark } from '../components/Wordmark';
import {
	ChannelIcon,
	EncoderIcon,
	LiveIcon,
	QueueIcon,
	ReleaseIcon,
	UploadIcon,
	VodIcon,
} from '../components/icons';
import { useMe } from '../lib/auth';

// Viewer routes read roomier; studio/ops/settings stay dense (Nocturne readme, "App shell").
const viewerPaths = ['/', '/search', '/channel'];

export function RootLayout() {
	const { data: me } = useMe();
	const { pathname } = useLocation();
	const roomy = viewerPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
	const initials = me ? `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}` : '';
	const displayName = me ? `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() || me.email : '';
	// <1024px the sidenav is a drawer off this toggle (CSS-only breakpoint)
	const [navOpen, setNavOpen] = useState(false);
	// navigating from the drawer closes it: state resets during render (the
	// route element is not remounted — the Watch.tsx pattern), Escape closes
	// it via the effect below
	const [navPath, setNavPath] = useState(pathname);
	if (navPath !== pathname) {
		setNavPath(pathname);
		setNavOpen(false);
	}
	useEffect(() => {
		if (!navOpen) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setNavOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [navOpen]);

	return (
		<div className="app">
			<aside className="app-side" data-open={navOpen ? '' : undefined} id="app-side">
				<div className="app-brand">
					<Link to="/" aria-label="Streamy home">
						<Wordmark />
					</Link>
				</div>
				<nav className="sidenav" style={{ flex: 1 }}>
					<div className="sidenav-head">Watch</div>
					<NavLink to="/">
						<VodIcon width={16} height={16} aria-hidden /> Home
					</NavLink>
					<NavLink to="/search">
						<MagnifyingGlass size={16} aria-hidden /> Search
					</NavLink>
					<NavLink to="/playlists">
						<QueueIcon width={16} height={16} aria-hidden /> Playlists
					</NavLink>
					<div className="sidenav-head">Studio</div>
					<NavLink to="/studio/videos">
						<ReleaseIcon width={16} height={16} aria-hidden /> Studio
					</NavLink>
					{/* No endpoint lists subscriptions yet — the section stays
					    honestly empty instead of shipping fake rows. */}
					<div className="sidenav-head">Subscriptions</div>
					<div className="sidenav-head">Instance</div>
					<NavLink to="/ops">
						<EncoderIcon width={16} height={16} aria-hidden /> Ops
					</NavLink>
					<NavLink to="/settings">
						<ChannelIcon width={16} height={16} aria-hidden /> Settings
					</NavLink>
				</nav>
				<div className="app-channel">
					<div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
						<span className="avatar avatar-sm">{initials}</span>
						<div style={{ minWidth: 0 }}>
							<div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{displayName}</div>
							<div
								className="mono"
								style={{ fontSize: 10, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}
							>
								current channel
							</div>
						</div>
					</div>
					<Link className="btn btn-secondary btn-sm btn-block" to="/settings#channels">
						Switch channel
					</Link>
				</div>
			</aside>
			{navOpen && (
				<button
					className="app-nav-backdrop"
					type="button"
					aria-label="Close navigation menu"
					onClick={() => setNavOpen(false)}
				/>
			)}
			<div className="app-col">
				<header className="topbar" style={{ gap: 16 }}>
					<button
						className="btn btn-icon btn-secondary app-nav-toggle"
						type="button"
						aria-controls="app-side"
						aria-expanded={navOpen}
						aria-label="Navigation menu"
						onClick={() => setNavOpen((open) => !open)}
					>
						<List size={16} aria-hidden />
					</button>
					<label className="searchbar" style={{ flex: 1, maxWidth: 460 }}>
						<MagnifyingGlass size={15} aria-hidden />
						<input type="search" placeholder="Search videos" aria-label="Search videos" />
					</label>
					<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
						<Link className="btn btn-secondary" to="/studio/upload">
							<UploadIcon width={15} height={15} aria-hidden /> Upload
						</Link>
						<Link className="btn btn-primary" to="/studio/go-live">
							<LiveIcon width={15} height={15} aria-hidden /> Go live
						</Link>
						<span className="avatar">{initials}</span>
					</div>
				</header>
				<main className="app-page" data-density={roomy ? 'roomy' : undefined}>
					<Outlet />
				</main>
			</div>
		</div>
	);
}
