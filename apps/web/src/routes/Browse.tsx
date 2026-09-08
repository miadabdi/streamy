import { useState } from 'react';
import { Link } from 'react-router';
import { LoadMore } from '../components/LoadMore';
import { VideoGrid } from '../components/VideoGrid';
import { VodIcon } from '../components/icons';
import { useVideos, type VideoFilter } from '../hooks/useVideos';
import { useMe } from '../lib/auth';

const emptyCopy: Record<VideoFilter, { title: string; body: string }> = {
	all: {
		title: 'Nothing released yet',
		body: 'This instance is fresh. Upload a video, let it transcode, then release it — it shows up here the moment you do.',
	},
	live: {
		title: 'Nobody is live right now',
		body: 'Live streams appear here the moment they start.',
	},
	subscribed: {
		title: 'Nothing from your subscriptions yet',
		body: 'Subscribe to channels and their released videos collect here.',
	},
};

export function Browse() {
	const { data: me } = useMe();
	const [filter, setFilter] = useState<VideoFilter>('all');
	const videos = useVideos(filter);
	const items = videos.data?.pages.flat() ?? [];

	return (
		<>
			<div className="page-head">
				<div>
					<h1>Browse</h1>
					<p className="page-sub">Released videos on this instance</p>
				</div>
				<div className="seg" role="group" aria-label="Filter videos">
					<label className="seg-opt">
						<input
							type="radio"
							name="browse-filter"
							checked={filter === 'all'}
							onChange={() => setFilter('all')}
						/>
						All
					</label>
					<label className="seg-opt">
						<input
							type="radio"
							name="browse-filter"
							checked={filter === 'live'}
							onChange={() => setFilter('live')}
						/>
						Live
					</label>
					{me && (
						<label className="seg-opt">
							<input
								type="radio"
								name="browse-filter"
								checked={filter === 'subscribed'}
								onChange={() => setFilter('subscribed')}
							/>
							Subscribed
						</label>
					)}
				</div>
			</div>

			{videos.isError ? (
				<p className="page-sub">Could not load videos.</p>
			) : videos.isPending ? (
				<p className="page-sub">Loading…</p>
			) : items.length === 0 ? (
				<div className="empty">
					<VodIcon className="empty-mark" width={32} height={32} aria-hidden />
					<h4>{emptyCopy[filter].title}</h4>
					<p>{emptyCopy[filter].body}</p>
					{filter === 'all' && (
						<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
							<Link className="btn btn-primary" to="/studio/upload">
								Upload your first video
							</Link>
							<Link className="btn btn-secondary" to="/studio/go-live">
								Go live instead
							</Link>
						</div>
					)}
				</div>
			) : (
				<section style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 20 }}>
					<VideoGrid videos={items} />
					{videos.hasNextPage && (
						<LoadMore
							onLoad={() => videos.fetchNextPage()}
							showing={items.length}
							busy={videos.isFetchingNextPage}
						/>
					)}
				</section>
			)}
		</>
	);
}
