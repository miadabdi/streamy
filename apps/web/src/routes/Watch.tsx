import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router';
import { ChannelAvatar, CommentThread } from '../components/CommentThread';
import { Skeleton } from '../components/Skeleton';
import { VideoPlayer, type PlayerMode } from '../components/player/VideoPlayer';
import { useVideo } from '../hooks/useVideo';
import { api } from '../lib/api';
import { myChannelId, useMe } from '../lib/auth';
import { startedAgo } from '../lib/format';
import { isPending, type WatchVideo } from '../types/api';

function playerMode(video: WatchVideo): PlayerMode {
	if (video.type !== 'live') return 'vod';
	return video.isActive === false ? 'replay' : 'live';
}

function statLine(video: WatchVideo): string {
	if (video.type === 'live' && video.isActive !== false) return `Live · ${startedAgo(video.createdAt)}`;
	const verb = video.type === 'live' ? 'streamed' : 'released';
	const date = video.releasedAt ? new Date(video.releasedAt).toLocaleDateString() : '';
	return `${(video.numberOfVisits ?? 0).toLocaleString()} views${date ? ` · ${verb} ${date}` : ''}`;
}

type Stance = 'like' | 'dislike' | null;

// everything that belongs to one video: reset for a new route param by
// adjusting state during render (the route element is not remounted)
type VideoViewState = {
	id: number;
	stance: Stance;
	subscribed: boolean;
	expanded: boolean;
	beaconed: boolean;
};

const clampStyle: CSSProperties = {
	display: '-webkit-box',
	WebkitLineClamp: 2,
	WebkitBoxOrient: 'vertical',
	overflow: 'hidden',
};

export function Watch() {
	const { id: idParam } = useParams();
	const id = Number(idParam);
	const videoQuery = useVideo(id);
	const { data: me } = useMe();
	const channelId = me ? myChannelId(me) : undefined;
	const queryClient = useQueryClient();

	const [view, setView] = useState<VideoViewState>({
		id,
		stance: null,
		subscribed: false,
		expanded: false,
		beaconed: false,
	});
	// NaN ids never enter this reset (NaN !== NaN would loop forever)
	if (Number.isInteger(id) && view.id !== id)
		setView({ id, stance: null, subscribed: false, expanded: false, beaconed: false });

	const video = videoQuery.data;

	const like = useMutation({
		mutationFn: async ({ from, to }: { from: Stance; to: Stance }) => {
			// one backend op per transition (no "move" type exists)
			const ops: string[] = [];
			if (from === 'like' && to !== 'like') ops.push('unlike');
			if (from === 'dislike' && to !== 'dislike') ops.push('undislike');
			if (to === 'like' && from !== 'like') ops.push('like');
			if (to === 'dislike' && from !== 'dislike') ops.push('dislike');
			for (const type of ops) {
				await api.post('/api/v1/video/like-dislike', { type, videoId: id, likerChannelId: channelId });
			}
		},
		onMutate: async ({ from, to }) => {
			await queryClient.cancelQueries({ queryKey: ['video', id] });
			const previous = queryClient.getQueryData<WatchVideo>(['video', id]);
			if (previous) {
				queryClient.setQueryData(['video', id], {
					...previous,
					numberOfLikes: (previous.numberOfLikes ?? 0) + (to === 'like' ? 1 : 0) - (from === 'like' ? 1 : 0),
					numberOfDislikes:
						(previous.numberOfDislikes ?? 0) + (to === 'dislike' ? 1 : 0) - (from === 'dislike' ? 1 : 0),
				});
			}
			return { previous };
		},
		onError: (_error, variables, context) => {
			if (context?.previous) queryClient.setQueryData(['video', id], context.previous);
			setView((v) => ({ ...v, stance: variables.from })); // the optimistic flip rolls back too
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['video', id] }),
	});

	const subscribe = useMutation({
		mutationFn: (on: boolean) =>
			api.post(`/api/v1/channel/${on ? 'add-subscription' : 'delete-subscription'}`, {
				followerId: channelId,
				followeeId: video!.channel!.id,
			}),
		onMutate: async (on) => {
			await queryClient.cancelQueries({ queryKey: ['video', id] });
			const previous = queryClient.getQueryData<WatchVideo>(['video', id]);
			if (previous?.channel) {
				queryClient.setQueryData(['video', id], {
					...previous,
					channel: {
						...previous.channel,
						numberOfSubscribers: (previous.channel.numberOfSubscribers ?? 0) + (on ? 1 : -1),
					},
				});
			}
			return { previous };
		},
		onError: (_error, on, context) => {
			if (context?.previous) queryClient.setQueryData(['video', id], context.previous);
			setView((v) => ({ ...v, subscribed: !on }));
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['video', id] }),
	});

	function setStanceTo(to: Stance) {
		if (!video || !me || channelId == null) return;
		like.mutate({ from: view.stance, to });
		setView((v) => ({ ...v, stance: to }));
	}

	function markWatched() {
		if (view.beaconed || !me || channelId == null) return;
		setView((v) => ({ ...v, beaconed: true }));
		// beacon, not state: a lost POST is not worth surfacing
		api.post('/api/v1/video/watched', { videoId: id, watcherChannelId: channelId }).catch(() => {});
	}

	if (!Number.isInteger(id)) {
		return (
			<div className="card">
				<div className="card-kicker">404</div>
				<p className="card-body">No such video.</p>
			</div>
		);
	}

	if (videoQuery.isPending) {
		return <Skeleton variant="watch" />;
	}

	if (videoQuery.isError || !video) {
		return (
			<div className="card">
				<div className="card-kicker">404</div>
				<p className="card-body">No such video.</p>
			</div>
		);
	}

	const processing = isPending(video.processingStatus);
	const description = video.description ?? '';
	const longDescription = description.length > 220;
	const ownChannel = me != null && video.channel?.ownerId === me.id;
	const canEngage = channelId != null;
	const channel = video.channel;
	const subs = channel?.numberOfSubscribers ?? 0;
	const { stance, subscribed, expanded } = view;

	return (
		<>
			{processing ? (
				<div className="card" style={{ width: '100%' }}>
					<div className="card-kicker">Processing</div>
					<p className="card-body">
						This video is still processing — the page will update itself.
					</p>
				</div>
			) : (
				<VideoPlayer
					key={video.id}
					videoId={video.id}
					mode={playerMode(video)}
					subtitles={video.subtitles}
					onWatched={markWatched}
				/>
			)}

			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				<h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.25 }}>{video.name}</h1>
				<div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
					<div className="vcard-meta" style={{ fontSize: 12 }}>
						{statLine(video)}
					</div>
					{canEngage ? (
						<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
							<button
								type="button"
								className="btn btn-secondary btn-sm"
								aria-label="Like"
								aria-pressed={stance === 'like'}
								style={
									stance === 'like'
										? { color: 'var(--color-accent)', borderColor: 'var(--color-accent-700)' }
										: undefined
								}
								onClick={() => setStanceTo(stance === 'like' ? null : 'like')}
							>
								<ArrowUp size={14} aria-hidden />
								{(video.numberOfLikes ?? 0).toLocaleString()}
							</button>
							<button
								type="button"
								className="btn btn-secondary btn-sm"
								aria-label="Dislike"
								aria-pressed={stance === 'dislike'}
								style={
									stance === 'dislike'
										? { color: 'var(--color-accent)', borderColor: 'var(--color-accent-700)' }
										: undefined
								}
								onClick={() => setStanceTo(stance === 'dislike' ? null : 'dislike')}
							>
								<ArrowDown size={14} aria-hidden />
								{(video.numberOfDislikes ?? 0).toLocaleString()}
							</button>
						</div>
					) : (
						!me && (
							<Link to="/signin" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>
								Sign in to like
							</Link>
						)
					)}
				</div>
			</div>

			{channel && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						padding: '14px 0',
					}}
				>
					<ChannelAvatar channel={channel} size="" />
					<div style={{ minWidth: 0, flex: 1 }}>
						<Link
							to={`/channel/${channel.username}`}
							style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--color-text)', textDecoration: 'none' }}
						>
							{channel.name}
						</Link>
						<div className="mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
							{subs.toLocaleString()} {subs === 1 ? 'subscriber' : 'subscribers'}
						</div>
					</div>
					{canEngage && !ownChannel && (
						<button
							type="button"
							className={subscribed ? 'btn btn-secondary' : 'btn btn-primary'}
							aria-pressed={subscribed}
							onClick={() => {
								subscribe.mutate(!subscribed);
								setView((v) => ({ ...v, subscribed: !subscribed }));
							}}
						>
							{subscribed ? 'Subscribed' : 'Subscribe'}
						</button>
					)}
				</div>
			)}

			{video.videosToTags.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
					{video.videosToTags.map((vt, index) =>
						vt.tag ? (
							<span className="tag" key={vt.tag.id ?? index}>
								{vt.tag.title}
							</span>
						) : null,
					)}
				</div>
			)}

			<div className="card" style={{ gap: 6 }}>
				<div className="card-kicker">Description</div>
				<p
					className="card-body"
					style={{ color: 'var(--color-text)', ...(longDescription && !expanded ? clampStyle : {}) }}
				>
					{description}
				</p>
				{longDescription && (
					<button
						type="button"
						className="btn btn-ghost btn-sm"
						style={{ alignSelf: 'flex-start', paddingInline: 0 }}
						onClick={() => setView((v) => ({ ...v, expanded: !v.expanded }))}
					>
						{expanded ? 'Show less' : 'Show more'}
					</button>
				)}
			</div>

			<CommentThread video={video} me={me} />
		</>
	);
}
