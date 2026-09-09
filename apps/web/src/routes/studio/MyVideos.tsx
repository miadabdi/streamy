import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { LogDrawer } from '../../components/LogDrawer';
import { StatusPill } from '../../components/StatusPill';
import { Thumb } from '../../components/Thumb';
import { UploadIcon } from '../../components/icons';
import { api } from '../../lib/api';
import { channelInitials, timeAgo } from '../../lib/format';
import { isPending, type VideoListItem } from '../../types/api';

// GetVideosDto.type has no "all": my-channels answers one type per call, so the
// page runs the two fixed queries and shows both. ponytail: limit 100 per type,
// LoadMore paging when studios outgrow it.
const LIMIT = 100;

function useMyChannelVideos(type: 'vod' | 'live') {
	return useQuery({
		queryKey: ['studio-videos', type],
		queryFn: () => api.get<VideoListItem[]>(`/api/v1/video/my-channels?type=${type}&limit=${LIMIT}`),
		// 10s while anything is still moving through the pipeline — the polling
		// lives in the query options (useVideo pattern), never in an interval
		refetchInterval: (query) =>
			query.state.data?.some((video) => isPending(video.processingStatus)) ? 10_000 : false,
	});
}

function RowActions({ video, onRelease, onViewLog, releasing }: {
	video: VideoListItem;
	onRelease: (id: number) => void;
	onViewLog: (video: VideoListItem) => void;
	releasing: boolean;
}) {
	if (video.isReleased) {
		return (
			<div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
				<Link className="btn btn-secondary btn-sm" to={`/watch/${video.id}`}>
					Watch
				</Link>
				<Link className="btn btn-secondary btn-sm" to={`/studio/videos/${video.id}/edit`}>
					Edit
				</Link>
			</div>
		);
	}
	if (video.processingStatus === 'failed_in_processing') {
		return (
			<button className="btn btn-danger btn-sm" type="button" onClick={() => onViewLog(video)}>
				View log
			</button>
		);
	}
	if (video.processingStatus === 'done') {
		return (
			<button
				className="btn btn-primary btn-sm"
				type="button"
				disabled={releasing}
				onClick={() => onRelease(video.id)}
			>
				Release
			</button>
		);
	}
	if (video.processingStatus === 'ready_for_upload') {
		return (
			<Link className="btn btn-secondary btn-sm" to="/studio/upload">
				Continue upload
			</Link>
		);
	}
	// still queued/processing/uploading: release is where this row is going
	return (
		<button className="btn btn-ghost btn-sm" type="button" disabled>
			Release
		</button>
	);
}

export function MyVideos() {
	const vods = useMyChannelVideos('vod');
	const lives = useMyChannelVideos('live');
	const [logVideo, setLogVideo] = useState<VideoListItem | null>(null);
	const queryClient = useQueryClient();

	const release = useMutation({
		mutationFn: (id: number) => api.post<{ message: string }>('/api/v1/video/release', { id }),
		onSuccess: ({ message }) => {
			toast.success(message);
			void queryClient.invalidateQueries({ queryKey: ['studio-videos'] });
		},
		onError: (error) => toast.error(error.message),
	});

	if (vods.isError || lives.isError) return <p className="page-sub">Could not load your videos.</p>;
	if (vods.isPending || lives.isPending) return <p className="page-sub">Loading…</p>;

	// lives first: what is on air outranks the archive
	const videos = [...(lives.data ?? []), ...(vods.data ?? [])];
	const unreleased = videos.filter((video) => !video.isReleased).length;

	if (videos.length === 0) {
		return (
			<>
				<div className="page-head">
					<div>
						<h1>My videos</h1>
						<p className="page-sub">Everything on your channels, released or not</p>
					</div>
				</div>
				<div className="empty">
					<UploadIcon className="empty-mark" width={32} height={32} aria-hidden />
					<h4>No videos on your channels yet</h4>
					<p>Upload a file and it will appear here while it transcodes — you decide when to release it.</p>
					<div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
						<Link className="btn btn-primary" to="/studio/upload">
							Upload your first video
						</Link>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="page-head">
				<div>
					<h1>My videos</h1>
					<p className="page-sub">
						{videos.length} video{videos.length === 1 ? '' : 's'} · {unreleased} unreleased
					</p>
				</div>
			</div>
			<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
				<div
					style={{
						borderRadius: 'var(--radius-md)',
						background: 'var(--color-surface)',
						boxShadow: 'var(--shadow-sm)',
						overflow: 'hidden',
					}}
				>
					<table className="table">
						<thead>
							<tr>
								<th style={{ width: '38%' }}>Video</th>
								<th>Channel</th>
								<th>Status</th>
								<th style={{ textAlign: 'right' }}>Views</th>
								<th style={{ textAlign: 'right' }}>Likes</th>
								<th>Created</th>
								<th style={{ textAlign: 'right' }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{videos.map((video) => (
								<tr key={video.id}>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
											<div style={{ width: 76, flex: 'none' }}>
												<Thumb
													seed={String(video.id)}
													initials={channelInitials(video.channel?.name)}
													file={video.thumbnailFile}
												/>
											</div>
											<div style={{ minWidth: 0 }}>
												<div style={{ fontWeight: 500 }}>{video.name}</div>
												<div
													className="mono"
													style={{ fontSize: 10.5, color: 'var(--color-muted)' }}
												>
													{video.type} · {video.videoId ?? 'no file yet'}
												</div>
											</div>
										</div>
									</td>
									<td>{video.channel?.name ?? '—'}</td>
									<td>
										<StatusPill video={video} />
									</td>
									<td className="num">{video.numberOfVisits?.toLocaleString() ?? '—'}</td>
									<td className="num">{video.numberOfLikes?.toLocaleString() ?? '—'}</td>
									<td className="mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
										{timeAgo(video.createdAt)}
									</td>
									<td style={{ textAlign: 'right' }}>
										<RowActions
											video={video}
											onRelease={(id) => release.mutate(id)}
											onViewLog={setLogVideo}
											releasing={release.isPending && release.variables === video.id}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{logVideo && <LogDrawer video={logVideo} onClose={() => setLogVideo(null)} />}
			</section>
		</>
	);
}
