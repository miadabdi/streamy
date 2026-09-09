import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { makeVideo, type Video } from '../../test/fixtures';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { GoLive } from './GoLive';

// jsdom host is localhost — the ingest URL must fall back to it (dev shape)
const STREAM_KEY = 'v_8Kd2pQxr3f91c8a2';
const CREATED = makeVideo({
	id: 42,
	videoId: STREAM_KEY,
	type: 'live',
	isReleased: false,
	processingStatus: 'ready_for_processing',
});

type LiveState = 'waiting' | 'processing' | 'ended';

const createdBodies: unknown[] = [];
const polls: string[] = [];
const writeText = vi.fn<(text: string) => Promise<void>>();
let liveState: LiveState;

function liveRow(): Video {
	// updatedAt = the publish flip; the elapsed clock anchors on it
	return makeVideo({
		...CREATED,
		processingStatus: 'processing',
		updatedAt: new Date('2026-01-01T00:00:00.000Z'),
	});
}

// jsdom's navigator.clipboard is getter-only, and userEvent.setup() swaps in
// its own stub — so the spy is defined per test, after setup().
function installClipboard() {
	writeText.mockReset();
	writeText.mockResolvedValue(undefined);
	Object.defineProperty(navigator, 'clipboard', {
		value: { writeText },
		configurable: true,
	});
}

beforeEach(() => {
	createdBodies.length = 0;
	polls.length = 0;
	liveState = 'waiting';
	server.use(
		http.post('/api/v1/video', async ({ request }) => {
			createdBodies.push(await request.json());
			return HttpResponse.json(CREATED);
		}),
		http.get('/api/v1/video/live-by-video-id', ({ request }) => {
			polls.push(new URL(request.url).searchParams.get('videoId') ?? '');
			// srsOnUnpublish flips isActive false → the endpoint stops matching the key
			if (liveState === 'ended') return HttpResponse.json(null);
			if (liveState === 'processing') return HttpResponse.json(liveRow());
			return HttpResponse.json(CREATED);
		}),
	);
});

afterEach(() => {
	vi.unstubAllEnvs();
});

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/studio/go-live" element={<GoLive />} />
			<Route path="/studio/videos" element={<p>videos marker</p>} />
			<Route path="/watch/:id" element={<p>watch marker</p>} />
		</Routes>,
		{ route: '/studio/go-live' },
	);
}

// userEvent hangs under fake timers in this stack (vitest 5), and this flow
// runs under both — fireEvent is synchronous and works either way.
function createStream() {
	fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Live from the closet' } });
	fireEvent.change(screen.getByLabelText('Description'), {
		target: { value: 'Sitting with the queue while the encoder works.' },
	});
	fireEvent.click(screen.getByRole('button', { name: 'Create live video' }));
}

// react-query notifies observers via setTimeout(0); one scheduled in the final
// step of an advance stays pending until the clock moves again — so every
// advance that should show up in the DOM gets a 1ms flush (never enough to
// reach the next 15s poll early)
async function tick(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
	await act(async () => {
		await vi.advanceTimersByTimeAsync(1);
	});
}

describe('Go live wizard', () => {
	it('creates a live video and hands over the ingest URL and masked key', async () => {
		const user = userEvent.setup();
		installClipboard();
		mount();

		createStream();

		await screen.findByText('Point your encoder here');

		// the wizard's one POST: type live, on the acting channel
		expect(createdBodies).toEqual([
			{
				name: 'Live from the closet',
				description: 'Sitting with the queue while the encoder works.',
				channelId: 1,
				type: 'live',
				tagIds: [],
			},
		]);
		expect(screen.getByText(`rtmp://localhost/live/${STREAM_KEY}`)).toHaveClass('mono');
		expect(document.querySelector('.secret[data-masked="true"]')).not.toBeNull();
		expect(screen.queryByText(STREAM_KEY)).toBeNull();
		expect(screen.getByText(/Treat it like a password/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Copy URL' }));
		expect(writeText).toHaveBeenCalledWith(`rtmp://localhost/live/${STREAM_KEY}`);

		// waiting for the encoder: status copy, and NO player until segments exist
		expect(await screen.findByText('Waiting for your stream')).toBeInTheDocument();
		expect(document.querySelector('video')).toBeNull();
	});

	it('honors VITE_RTMP_HOST over the page host', async () => {
		vi.stubEnv('VITE_RTMP_HOST', 'stream.home.lan');
		mount();

		createStream();

		expect(await screen.findByText(`rtmp://stream.home.lan/live/${STREAM_KEY}`)).toBeInTheDocument();
	});

	it('shows the create error with a retry when the POST fails', async () => {
		let failOnce = true;
		server.use(
			http.post('/api/v1/video', async ({ request }) => {
				if (failOnce) {
					failOnce = false;
					return new HttpResponse(null, { status: 400 });
				}
				createdBodies.push(await request.json());
				return HttpResponse.json(CREATED);
			}),
		);
		const user = userEvent.setup();
		mount();

		createStream();

		expect(await screen.findByRole('alert')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Try again' }));
		expect(await screen.findByText('Point your encoder here')).toBeInTheDocument();
	});

	it('polls every 15s through waiting → live → ended, then stops', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
		try {
			mount();
			createStream();

			// flush the POST + first poll under fake timers before asserting
			await tick(0);
			expect(screen.getByText('Waiting for your stream')).toBeInTheDocument();
			expect(polls).toEqual([STREAM_KEY]); // one immediate poll on entering the stage

			await tick(15_000);
			expect(polls).toHaveLength(2);
			expect(screen.getByText('Waiting for your stream')).toBeInTheDocument();

			liveState = 'processing';
			await tick(15_000);
			expect(polls).toHaveLength(3);
			expect(screen.getByText("You're live")).toBeInTheDocument();
			expect(document.querySelector('video')).not.toBeNull(); // self-monitor mounted

			liveState = 'ended';
			await tick(15_000);
			expect(polls).toHaveLength(4);
			expect(screen.getByText('Stream ended')).toBeInTheDocument();

			// ended: the poll is retired
			await tick(30_000);
			expect(polls).toHaveLength(4);
		} finally {
			vi.useRealTimers();
		}
	});

	it('shows elapsed as a ticking clock while live — never viewer counts', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
		try {
			mount();
			createStream();
			await tick(0);

			liveState = 'processing';
			await tick(15_000);
			expect(screen.getByText("You're live")).toBeInTheDocument();

			const elapsedClock = () => {
				const stat = screen.getByText('Elapsed').closest('.stat') as HTMLElement;
				const value = stat.querySelector('.stat-value .mono') as HTMLElement;
				return (value.textContent ?? '').split(':').reduce((t, p) => t * 60 + Number(p), 0);
			};

			const before = elapsedClock();
			expect(before).toBeGreaterThan(0);

			await tick(60_000);
			expect(elapsedClock()).toBe(before + 60);

			// honest copy: viewers are not reported by the API, never invented
			expect(screen.getByText('Not reported')).toBeInTheDocument();
		} finally {
			vi.useRealTimers();
		}
	});

	it('links the ended stream to its replay and can start another', async () => {
		const user = userEvent.setup();
		mount();
		createStream();

		liveState = 'ended'; // ended on the very first poll
		expect(await screen.findByText('Stream ended')).toBeInTheDocument();

		const replay = screen.getByRole('link', { name: 'Watch the replay' });
		expect(replay).toHaveAttribute('href', '/watch/42');

		await user.click(screen.getByRole('button', { name: 'Start another stream' }));
		expect(await screen.findByText('Set up the stream')).toBeInTheDocument();
		expect(createdBodies).toHaveLength(1); // restart is client-side only
	});
});
