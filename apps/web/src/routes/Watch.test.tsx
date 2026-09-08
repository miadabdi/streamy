import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	makeComment,
	makeTag,
	makeWatchVideo,
	type WatchVideo,
} from '../test/fixtures';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { Watch } from './Watch';

// Player stub: shows the props Watch chose, and lets tests drive onWatched.
vi.mock('../components/player/VideoPlayer', () => ({
	VideoPlayer: (props: { videoId: number; mode: string; onWatched?: () => void }) => (
		<div>
			<span data-testid="player">
				{props.videoId}:{props.mode}
			</span>
			<button type="button" onClick={() => props.onWatched?.()}>
				stub:watched
			</button>
		</div>
	),
}));

const likePosts: Array<Record<string, unknown>> = [];
const watchedPosts: Array<Record<string, unknown>> = [];
const subPosts: string[] = [];

function baseVideo(overrides: Partial<WatchVideo> = {}): WatchVideo {
	return makeWatchVideo({
		id: 7,
		name: 'Rebuilding the rack',
		description: 'Sitting with the queue while eleven uploads work through the encoder. '.repeat(8),
		numberOfVisits: 1204,
		numberOfLikes: 10,
		numberOfDislikes: 2,
		videosToTags: [{ tag: makeTag({ id: 1, title: 'ffmpeg' }) }, { tag: makeTag({ id: 2, title: 'hardware' }) }],
		channel: {
			id: 2,
			ownerId: 2,
			username: 'nightwatch',
			name: 'Night Watch',
			numberOfSubscribers: 5,
			avatar: null,
		} as WatchVideo['channel'],
		...overrides,
	});
}

// Server truth is stateful: engagement POSTs apply to the served video, so
// the invalidate-and-refetch after each mutation returns the same numbers the
// optimistic update predicted (exactly what the real backend does).
function mountWatch(
	video: WatchVideo,
	options: { session?: 'user' | 'anonymous'; route?: string; likeStatus?: number } = {},
) {
	const { session = 'user', route = '/watch/7', likeStatus = 201 } = options;
	const current: WatchVideo = { ...video, channel: video.channel ? { ...video.channel } : null };
	server.use(
		http.get('/api/v1/video/by-id', () => HttpResponse.json(current)),
		http.post('/api/v1/video/like-dislike', async ({ request }) => {
			const body = (await request.json()) as { type: string };
			likePosts.push(body as Record<string, unknown>);
			// a beat of latency keeps the optimistic state observable in tests
			await new Promise((resolve) => setTimeout(resolve, 25));
			if (likeStatus < 400) {
				if (body.type === 'like') current.numberOfLikes = (current.numberOfLikes ?? 0) + 1;
				if (body.type === 'unlike') current.numberOfLikes = (current.numberOfLikes ?? 0) - 1;
				if (body.type === 'dislike') current.numberOfDislikes = (current.numberOfDislikes ?? 0) + 1;
				if (body.type === 'undislike')
					current.numberOfDislikes = (current.numberOfDislikes ?? 0) - 1;
			}
			return new HttpResponse(null, { status: likeStatus });
		}),
		http.post('/api/v1/channel/add-subscription', async ({ request }) => {
			subPosts.push(String(((await request.json()) as { followeeId: number }).followeeId));
			if (current.channel)
				current.channel = {
					...current.channel,
					numberOfSubscribers: (current.channel.numberOfSubscribers ?? 0) + 1,
				};
			return new HttpResponse(null, { status: 201 });
		}),
		http.post('/api/v1/channel/delete-subscription', async ({ request }) => {
			subPosts.push(String(((await request.json()) as { followeeId: number }).followeeId));
			if (current.channel)
				current.channel = {
					...current.channel,
					numberOfSubscribers: (current.channel.numberOfSubscribers ?? 0) - 1,
				};
			return new HttpResponse(null, { status: 201 });
		}),
		http.post('/api/v1/video/watched', async ({ request }) => {
			watchedPosts.push((await request.json()) as Record<string, unknown>);
			return new HttpResponse(null, { status: 201 });
		}),
	);
	return renderWithApp(<Routes><Route path="/watch/:id" element={<Watch />} /></Routes>, {
		route,
		session,
	});
}

beforeEach(() => {
	likePosts.length = 0;
	watchedPosts.length = 0;
	subPosts.length = 0;
});

describe('Watch page', () => {
	it('renders the player, stats, tags, channel row, description and comments', async () => {
		mountWatch(baseVideo());

		expect(await screen.findByText('Rebuilding the rack')).toBeInTheDocument();
		expect(screen.getByTestId('player').textContent).toBe('7:vod');
		expect(screen.getByText(/1,204 views/)).toBeInTheDocument();
		expect(screen.getByText('ffmpeg')).toHaveClass('tag');
		expect(screen.getByText('hardware')).toHaveClass('tag');
		expect(screen.getByText('Night Watch')).toBeInTheDocument();
		expect(screen.getByText('5 subscribers')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
	});

	it('derives live and replay modes from the video', async () => {
		const live = mountWatch(baseVideo({ type: 'live', isActive: true, duration: null }));
		expect((await screen.findByTestId('player')).textContent).toBe('7:live');
		live.unmount();

		mountWatch(baseVideo({ type: 'live', isActive: false, duration: null }));
		expect((await screen.findByTestId('player')).textContent).toBe('7:replay');
	});

	it('hides engagement for anonymous visitors and links to signin instead', async () => {
		mountWatch(baseVideo(), { session: 'anonymous' });

		await screen.findByText('Rebuilding the rack');
		expect(screen.queryByRole('button', { name: 'Like' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Dislike' })).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
		expect(screen.getAllByRole('link', { name: /sign in/i }).length).toBeGreaterThan(0);
	});

	it('optimistically flips like/dislike including switches, then unlikes', async () => {
		const user = userEvent.setup();
		mountWatch(baseVideo());

		const like = await screen.findByRole('button', { name: 'Like' });
		const dislike = screen.getByRole('button', { name: 'Dislike' });
		expect(like.textContent).toBe('10');
		expect(dislike.textContent).toBe('2');

		await user.click(like);
		expect(like.textContent).toBe('11'); // optimistic, before any refetch
		expect(like).toHaveAttribute('aria-pressed', 'true');
		await waitFor(() =>
			expect(likePosts).toEqual([{ type: 'like', videoId: 7, likerChannelId: 1 }]),
		);

		// switch straight to dislike: unlike + dislike, in order
		await user.click(dislike);
		expect(dislike.textContent).toBe('3');
		expect(like.textContent).toBe('10');
		expect(dislike).toHaveAttribute('aria-pressed', 'true');
		await waitFor(() =>
			expect(likePosts.map((b) => b.type)).toEqual(['like', 'unlike', 'dislike']),
		);

		// un-dislike
		await user.click(dislike);
		expect(dislike.textContent).toBe('2');
		expect(dislike).toHaveAttribute('aria-pressed', 'false');
	});

	it('rolls the optimistic like back when the request fails', async () => {
		const user = userEvent.setup();
		mountWatch(baseVideo(), { likeStatus: 500 });

		const like = await screen.findByRole('button', { name: 'Like' });
		await user.click(like);
		expect(like.textContent).toBe('11'); // optimistic flip happened

		await waitFor(() => expect(like.textContent).toBe('10')); // rolled back
		expect(like).toHaveAttribute('aria-pressed', 'false');
	});

	it('subscribes and unsubscribes with an optimistic subscriber count', async () => {
		const user = userEvent.setup();
		mountWatch(baseVideo());

		await user.click(await screen.findByRole('button', { name: 'Subscribe' }));
		expect(screen.getByText('6 subscribers')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Subscribed' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Subscribed' }));
		expect(screen.getByText('5 subscribers')).toBeInTheDocument();
		expect(subPosts).toEqual(['2', '2']); // followeeId both ways
	});

	it('hides Subscribe on your own channel', async () => {
		const own = baseVideo();
		mountWatch(baseVideo({ channel: { ...own.channel!, ownerId: 1 } as WatchVideo['channel'] }));

		await screen.findByText('Rebuilding the rack');
		expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
	});

	it('expands and collapses a long description', async () => {
		const user = userEvent.setup();
		mountWatch(baseVideo());

		const more = await screen.findByRole('button', { name: 'Show more' });
		await user.click(more);
		expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
	});

	it('polls every 5s while processing and stops once done', async () => {
		vi.useFakeTimers();
		try {
			const calls: string[] = [];
			server.use(
				http.get('/api/v1/video/by-id', () => {
					calls.push('get');
					return HttpResponse.json(
						baseVideo({ processingStatus: calls.length === 1 ? 'processing' : 'done' }),
					);
				}),
			);
			renderWithApp(<Routes><Route path="/watch/:id" element={<Watch />} /></Routes>, {
				route: '/watch/7',
			});

			await act(async () => {
				await vi.advanceTimersByTimeAsync(10);
			});
			expect(calls).toHaveLength(1);
			expect(screen.getByText(/still processing/i)).toBeInTheDocument();
			expect(screen.queryByTestId('player')).not.toBeInTheDocument();

			await act(async () => {
				await vi.advanceTimersByTimeAsync(5_000);
			});
			expect(calls).toHaveLength(2);
			expect(screen.getByTestId('player').textContent).toBe('7:vod');

			await act(async () => {
				await vi.advanceTimersByTimeAsync(12_000);
			});
			expect(calls).toHaveLength(2); // done → no more polling
		} finally {
			vi.useRealTimers();
		}
	});

	it('fires the watched beacon once past 30s, only for signed-in viewers', async () => {
		const user = userEvent.setup();
		mountWatch(baseVideo());

		await user.click(await screen.findByRole('button', { name: 'stub:watched' }));
		await waitFor(() => expect(watchedPosts).toEqual([{ videoId: 7, watcherChannelId: 1 }]));

		await user.click(screen.getByRole('button', { name: 'stub:watched' }));
		await act(async () => {
			await Promise.resolve();
		});
		expect(watchedPosts).toHaveLength(1); // once per video
	});

	it('does not beacon for anonymous viewers', async () => {
		const user = userEvent.setup();
		mountWatch(baseVideo(), { session: 'anonymous' });

		await user.click(await screen.findByRole('button', { name: 'stub:watched' }));
		await act(async () => {
			await Promise.resolve();
		});
		expect(watchedPosts).toHaveLength(0);
	});

	it('rejects a non-numeric id without touching the API', async () => {
		renderWithApp(<Routes><Route path="/watch/:id" element={<Watch />} /></Routes>, {
			route: '/watch/not-a-number',
		});

		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.getByText(/no such video/i)).toBeInTheDocument();
		// an unhandled by-id request would fail the test (onUnhandledRequest: error)
	});

	it('renders comments through the thread component', async () => {
		mountWatch(
			baseVideo({
				comments: [makeComment({ id: 30, videoId: 7, ownerId: 2, content: 'great rack' })],
			}),
		);

		const heading = await screen.findByText('1 comments');
		const section = heading.closest('section');
		expect(section).not.toBeNull();
		expect(screen.getByText('great rack')).toBeInTheDocument();
		expect(screen.getByLabelText('Add a comment')).toBeInTheDocument();
	});
});

afterEach(() => {
	vi.useRealTimers();
});
