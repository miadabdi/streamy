import { useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { LoadMore } from '../components/LoadMore';
import { VideoGrid } from '../components/VideoGrid';
import { useDebounced } from '../hooks/useDebounced';
import { useVideoSearch } from '../hooks/useVideos';

export function Search() {
	const [text, setText] = useState('');
	const query = useDebounced(text, 300).trim();
	const results = useVideoSearch(query);
	const items = results.data?.pages.flat() ?? [];

	return (
		<>
			<div className="page-head">
				<div>
					<h1>Search</h1>
					<p className="page-sub">Matches the names and descriptions of released videos</p>
				</div>
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
				<label className="searchbar" style={{ maxWidth: 460 }}>
					<MagnifyingGlass size={15} aria-hidden />
					<input
						type="search"
						placeholder="Search videos"
						aria-label="Search videos"
						value={text}
						onChange={(e) => setText(e.target.value)}
						autoFocus
					/>
				</label>

				{query === '' ? (
					<p className="page-sub">Type to search this instance.</p>
				) : results.isError ? (
					<p className="page-sub">Could not run the search.</p>
				) : results.isPending ? (
					<p className="page-sub">Searching…</p>
				) : items.length === 0 ? (
					<div className="empty">
						<MagnifyingGlass className="empty-mark" size={32} aria-hidden />
						<h4>No videos match “{query}”</h4>
						<p>
							Search covers video names and descriptions on this instance only. Try a shorter
							word.
						</p>
						<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
							<Link className="btn btn-primary" to="/">
								Browse everything
							</Link>
						</div>
					</div>
				) : (
					<section style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
						<VideoGrid videos={items} />
						{results.hasNextPage && (
							<LoadMore
								onLoad={() => results.fetchNextPage()}
								showing={items.length}
								busy={results.isFetchingNextPage}
							/>
						)}
					</section>
				)}
			</div>
		</>
	);
}
