import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link, Outlet, useNavigate } from 'react-router';
import { ChannelAvatar } from '../components/CommentThread';
import { Wordmark } from '../components/Wordmark';
import { UploadIcon } from '../components/icons';
import { useMe } from '../lib/auth';

// Watch drops the sidenav — the player owns the width (Nocturne readme, "App shell").
export function WatchLayout() {
	const { data: me } = useMe();
	const navigate = useNavigate();
	// chrome identity is the current channel, same as RootLayout
	const currentChannel = me?.channels.find((c) => c.id === me.currentChannelId) ?? null;

	return (
		<div className="app-col" data-density="roomy" style={{ minHeight: '100vh' }}>
			<header className="topbar" style={{ gap: 16 }}>
				<Link to="/" aria-label="Streamy home">
					<Wordmark />
				</Link>
				<form
					className="searchbar"
					role="search"
					style={{ flex: 1, maxWidth: 420, marginLeft: 12 }}
					onSubmit={(event) => {
						event.preventDefault();
						const text = String(new FormData(event.currentTarget).get('q') ?? '').trim();
						navigate(text ? `/search?q=${encodeURIComponent(text)}` : '/search');
					}}
				>
					<MagnifyingGlass size={15} aria-hidden />
					<input type="search" name="q" placeholder="Search videos" aria-label="Search videos" />
				</form>
				<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
					<Link className="btn btn-secondary" to="/studio/upload">
						<UploadIcon width={15} height={15} aria-hidden /> Upload
					</Link>
					<Link to="/settings" aria-label="Profile and channel settings">
					<ChannelAvatar channel={currentChannel} size="" />
				</Link>
				</div>
			</header>
			{/* .watch-main (nocturne.css) so the small-screen breakpoint can widen it */}
			<main className="watch-main">
				<Outlet />
			</main>
		</div>
	);
}
