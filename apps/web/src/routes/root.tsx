import { MagnifyingGlass } from '@phosphor-icons/react';
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

// Demo subscription rows (from the home-browse template) until the real
// subscription list arrives with the viewer tasks.
const demoSubs = [
	{ username: 'nightwatch', initials: 'NW', live: true },
	{ username: 'kbench', initials: 'KB', live: false },
	{ username: 'selfhost.cafe', initials: 'SC', live: false },
	{ username: 'attic.tv', initials: 'AT', live: true },
	{ username: 'longwave', initials: 'LW', live: false },
];

// Viewer routes read roomier; studio/ops/settings stay dense (Nocturne readme, "App shell").
const viewerPaths = ['/', '/search', '/channel'];

export function RootLayout() {
	const { data: me } = useMe();
	const { pathname } = useLocation();
	const roomy = viewerPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
	const initials = me ? `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}` : '';
	const displayName = me ? `${me.firstName ?? ''} ${me.lastName ?? ''}`.trim() || me.email : '';

	return (
		<div className="app">
			<aside className="app-side">
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
					<div className="sidenav-head">Subscriptions</div>
					{demoSubs.map((sub) => (
						<NavLink key={sub.username} to={`/channel/${sub.username}`}>
							<span className="avatar avatar-sm">{sub.initials}</span>
							<span className="name">{sub.username}</span>
							{sub.live && <span className="livedot" title="Live now" />}
						</NavLink>
					))}
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
					<button className="btn btn-secondary btn-sm btn-block" type="button">
						Switch channel
					</button>
				</div>
			</aside>
			<div className="app-col">
				<header className="topbar" style={{ gap: 16 }}>
					<label className="searchbar" style={{ flex: 1, maxWidth: 460 }}>
						<MagnifyingGlass size={15} aria-hidden />
						<input type="search" placeholder="Search videos" aria-label="Search videos" />
					</label>
					<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
						<button className="btn btn-secondary" type="button">
							<UploadIcon width={15} height={15} aria-hidden /> Upload
						</button>
						<button className="btn btn-primary" type="button">
							<LiveIcon width={15} height={15} aria-hidden /> Go live
						</button>
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
