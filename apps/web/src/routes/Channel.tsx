import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ChannelAvatar } from '../components/CommentThread';
import { LoadMore } from '../components/LoadMore';
import { VideoGrid } from '../components/VideoGrid';
import { VodIcon } from '../components/icons';
import { useVideos } from '../hooks/useVideos';
import { api } from '../lib/api';
import { myChannelId, useMe } from '../lib/auth';
import type { ChannelWithAvatar } from '../types/api';

/**
 * A channel's public page (Nocturne/templates/channel/Channel.dc.html): header
 * (avatar with initials fallback, name, @handle + subscriber count,
 * description, subscribe) above the channel's released vods.
 */
export function Channel() {
	const { username = '' } = useParams();
	const { data: me } = useMe();
	const channelId = me ? myChannelId(me) : undefined;
	const queryClient = useQueryClient();
	// like Watch: the payload carries no follower relation, so the button
	// starts "Subscribe" even for an existing subscription and just toggles.
	// State is keyed by username because sidenav links move channel→channel
	// without remounting the route element.
	const [view, setView] = useState({ username, subscribed: false });
	if (view.username !== username) setView({ username, subscribed: false });
	const subscribed = view.subscribed;

	const channelQuery = useQuery({
		queryKey: ['channel', username],
		queryFn: () =>
			api.get<ChannelWithAvatar | null>(
				`/api/v1/channel/by-username?username=${encodeURIComponent(username)}`,
			),
	});
	const channel = channelQuery.data;

	const subscribe = useMutation({
		mutationFn: (on: boolean) =>
			api.post(`/api/v1/channel/${on ? 'add-subscription' : 'delete-subscription'}`, {
				followerId: channelId,
				followeeId: channel!.id,
			}),
		onMutate: async (on) => {
			await queryClient.cancelQueries({ queryKey: ['channel', username] });
			const previous = queryClient.getQueryData<ChannelWithAvatar | null>(['channel', username]);
			if (previous) {
				queryClient.setQueryData(['channel', username], {
					...previous,
					numberOfSubscribers: (previous.numberOfSubscribers ?? 0) + (on ? 1 : -1),
				});
			}
			return { previous };
		},
		onError: (_error, on, context) => {
			if (context?.previous) queryClient.setQueryData(['channel', username], context.previous);
			setView((v) => ({ ...v, subscribed: !on })); // the optimistic flip rolls back too
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ['channel', username] }),
	});

	if (channelQuery.isPending) {
		return (
			<div className="card">
				<div className="card-kicker">Loading</div>
				<p className="card-body">Fetching this channel…</p>
			</div>
		);
	}

	if (channelQuery.isError) {
		return (
			<div className="empty">
				<VodIcon className="empty-mark" width={32} height={32} aria-hidden />
				<h4>Couldn’t load this channel</h4>
				{!me ? (
					// GET /channel/by-username is JWT-gated in the API today
					<p>
						Channels need a signed-in viewer.{' '}
						<Link to="/signin">Sign in</Link> to see this page.
					</p>
				) : (
					<p>Something went wrong fetching it.</p>
				)}
			</div>
		);
	}

	if (!channel) {
		return (
			<div className="empty">
				<VodIcon className="empty-mark" width={32} height={32} aria-hidden />
				<h4>No channel named @{username}</h4>
				<p>Nobody here by that name.</p>
			</div>
		);
	}

	const ownChannel = me != null && channel.ownerId === me.id;
	const subs = channel.numberOfSubscribers ?? 0;

	return (
		<>
			<section style={{ display: 'flex', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' }}>
				<ChannelAvatar channel={channel} size="lg" />
				<div
					style={{
						flex: '1 1 320px',
						minWidth: 0,
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
					}}
				>
					<h1 style={{ margin: 0, fontSize: 26 }}>{channel.name}</h1>
					<div className="mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
						@{channel.username} · {subs.toLocaleString()} {subs === 1 ? 'subscriber' : 'subscribers'}
					</div>
					{channel.description && (
						<p
							style={{
								margin: '4px 0 0',
								maxWidth: '62ch',
								color: 'var(--color-muted)',
							}}
						>
							{channel.description}
						</p>
					)}
					<div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
						{channelId != null && !ownChannel ? (
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
						) : (
							!me && (
								<Link to="/signin" className="btn btn-primary">
									Sign in to subscribe
								</Link>
							)
						)}
					</div>
				</div>
			</section>
			<ChannelVideos channelId={channel.id} channelName={channel.name} />
		</>
	);
}

/** The channel's released vods. Own component so the list query waits for the
 * channel id instead of firing a channel-less request while it loads. */
function ChannelVideos({ channelId, channelName }: { channelId: number; channelName: string }) {
	const videos = useVideos('all', channelId); // 'all' = server's default type=vod
	const items = videos.data?.pages.flat() ?? [];

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 28, marginTop: 28 }}>
			{videos.isError ? (
				<p className="page-sub">Could not load videos.</p>
			) : videos.isPending ? (
				<p className="page-sub">Loading…</p>
			) : items.length === 0 ? (
				<div className="empty">
					<VodIcon className="empty-mark" width={32} height={32} aria-hidden />
					<h4>{channelName} hasn’t released anything yet</h4>
					<p>Subscribe and the channel’s first video will show up in your subscribed filter on Browse.</p>
				</div>
			) : (
				<>
					<VideoGrid videos={items} />
					{videos.hasNextPage && (
						<LoadMore
							onLoad={() => videos.fetchNextPage()}
							showing={items.length}
							busy={videos.isFetchingNextPage}
						/>
					)}
				</>
			)}
		</section>
	);
}
