import { useEffect, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Link, useSearchParams } from 'react-router';
import { LoadMore } from '../components/LoadMore';
import { VideoGrid } from '../components/VideoGrid';
import { useDebounced } from '../hooks/useDebounced';
import { useVideoSearch } from '../hooks/useVideos';

export function Search() {
	const [searchParams, setSearchParams] = useSearchParams();
	const qParam = searchParams.get('q') ?? '';
	// ?q= is the contract with the topbar search, which can re-target this
	// route without remounting it — track the param and reseed (the navPath
	// pattern in root.tsx)
	const [view, setView] = useState({ q: qParam, text: qParam });
	if (view.q !== qParam) setView({ q: qParam, text: qParam });
	const text = view.text;
	const query = useDebounced(text, 300).trim();
	// keep the URL honest about the live query (shareable, and the topbar
	// round-trip works when this element stays mounted)
	useEffect(() => {
		setSearchParams(query ? { q: query } : {}, { replace: true });
	}, [query, setSearchParams]);
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
						onChange={(e) => setView({ q: qParam, text: e.target.value })}
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
