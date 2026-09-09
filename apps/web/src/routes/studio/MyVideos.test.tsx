import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChannel, makeVideoListItem, type VideoListItem } from '../../test/fixtures';
import type { VideoProcessingStatus } from '../../types/api';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { MyVideos } from './MyVideos';

const nightwatch = makeChannel({ id: 1, username: 'nightwatch', name: 'Night Watch' });

const RAW_LOG =
	"[hls @ 0x55f1c2] Opening 'v_5/720p_0012.ts' for writing\nError while filtering: Invalid argument";

// One row per lifecycle state, plus a released vod and a released live stream.
let pool: VideoListItem[];

function seedPool() {
	pool = [
		makeVideoListItem({
			id: 1,
			name: 'Rebuilding the rack',
			channel: nightwatch,
			isReleased: true,
			numberOfVisits: 1204,
			numberOfLikes: 38,
		}),
		makeVideoListItem({
			id: 2,
			name: 'Wiring the closet',
			channel: nightwatch,
			isReleased: false,
			numberOfVisits: null,
			numberOfLikes: null,
		}),
		makeVideoListItem({
			id: 3,
			name: 'Fan curves part three',
			channel: nightwatch,
			isReleased: false,
			processingStatus: 'processing',
		}),
		makeVideoListItem({
			id: 4,
			name: 'Two disks one enclosure',
			channel: nightwatch,
			isReleased: false,
			processingStatus: 'waiting_in_queue',
		}),
		makeVideoListItem({
			id: 5,
			name: 'Overnight queue, second attempt',
			channel: nightwatch,
			isReleased: false,
			processingStatus: 'failed_in_processing',
			ffmpegProcessLogs: RAW_LOG,
		}),
		makeVideoListItem({
			id: 6,
			name: 'Untitled draft',
			channel: nightwatch,
			isReleased: false,
			processingStatus: 'ready_for_upload',
			videoId: null,
		}),
		makeVideoListItem({
			id: 7,
			name: 'Ready to process draft',
			channel: nightwatch,
			isReleased: false,
			processingStatus: 'ready_for_processing',
		}),
		makeVideoListItem({
			id: 8,
			name: 'Live from the closet',
			channel: nightwatch,
			type: 'live',
			isReleased: true,
			numberOfLikes: 12,
		}),
	];
}

const releases: unknown[] = [];

beforeEach(() => {
	seedPool();
	releases.length = 0;
	server.use(
		// my-channels filters by one type per call (GetVideosDto.type has no "all")
		http.get('/api/v1/video/my-channels', ({ request }) => {
			const type = new URL(request.url).searchParams.get('type') ?? 'vod';
			return HttpResponse.json(pool.filter((v) => v.type === type));
		}),
		http.post('/api/v1/video/release', async ({ request }) => {
			releases.push(await request.json());
			const id = (releases.at(-1) as { id: number }).id;
			const video = pool.find((v) => v.id === id);
			if (video) {
				video.isReleased = true;
				video.releasedAt = new Date();
			}
			return HttpResponse.json({ message: 'Video released successfully' });
		}),
	);
});

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/studio/videos" element={<MyVideos />} />
			<Route path="/studio/videos/:id/edit" element={<p>edit marker</p>} />
			<Route path="/studio/upload" element={<p>upload marker</p>} />
			<Route path="/watch/:id" element={<p>watch marker</p>} />
		</Routes>,
		{ route: '/studio/videos' },
	);
}

function rowTitled(name: string): HTMLElement {
	return screen.getByText(name).closest('tr') as HTMLElement;
}

async function mountedRow(name: string): Promise<HTMLElement> {
	await screen.findByText(name);
	return rowTitled(name);
}

describe('My videos', () => {
	it('lists every lifecycle state with its pill, including unreleased rows', async () => {
		mount();

		expect((await mountedRow('Rebuilding the rack')).querySelector('.pill-released')).not.toBeNull();
		expect(within(rowTitled('Rebuilding the rack')).getByText('Done')).toHaveClass('pill-done');
		expect(within(rowTitled('Wiring the closet')).getByText('Done')).toHaveClass('pill-done');
		expect(within(rowTitled('Fan curves part three')).getByText('Processing')).toHaveClass(
			'pill-processing',
		);
		expect(within(rowTitled('Two disks one enclosure')).getByText('Waiting in queue')).toHaveClass(
			'pill-queue',
		);
		expect(within(rowTitled('Overnight queue, second attempt')).getByText('Failed')).toHaveClass(
			'pill-failed',
		);
		expect(within(rowTitled('Untitled draft')).getByText('Ready for upload')).toHaveClass(
			'pill-upload',
		);
		expect(within(rowTitled('Ready to process draft')).getByText('Ready for processing')).toHaveClass(
			'pill-queue',
		);
		expect(within(rowTitled('Live from the closet')).getByText('Live')).toHaveClass('pill-live');
		expect(rowTitled('Live from the closet').querySelector('.pill-released')).not.toBeNull();

		expect(within(rowTitled('Rebuilding the rack')).getByText('1,204')).toBeInTheDocument();
		expect(within(rowTitled('Wiring the closet')).getAllByText('—')).toHaveLength(2);
	});

	it('offers Release only on done rows and posts the release to the API', async () => {
		const user = userEvent.setup();
		mount();
		await mountedRow('Wiring the closet');

		await user.click(within(rowTitled('Wiring the closet')).getByRole('button', { name: 'Release' }));

		expect(releases).toEqual([{ id: 2 }]);
		// the list refetches and the row flips to released, with a Watch link
		expect(await within(rowTitled('Wiring the closet')).findByText('Released')).toBeInTheDocument();
		expect(
			within(rowTitled('Wiring the closet')).getByRole('link', { name: 'Watch' }),
		).toHaveAttribute('href', '/watch/2');
		expect(
			within(rowTitled('Wiring the closet')).queryByRole('button', { name: 'Release' }),
		).toBeNull();
	});

	it('disables Release while a video is still moving through the pipeline', async () => {
		mount();
		await mountedRow('Fan curves part three');

		expect(
			within(rowTitled('Fan curves part three')).getByRole('button', { name: 'Release' }),
		).toBeDisabled();
		expect(
			within(rowTitled('Two disks one enclosure')).getByRole('button', { name: 'Release' }),
		).toBeDisabled();
		expect(
			within(rowTitled('Untitled draft')).queryByRole('button', { name: 'Release' }),
		).toBeNull();
	});

	it('links released rows to watch/edit and drafts back to the upload page', async () => {
		mount();
		await mountedRow('Rebuilding the rack');

		expect(within(rowTitled('Rebuilding the rack')).getByRole('link', { name: 'Watch' })).toHaveAttribute(
			'href',
			'/watch/1',
		);
		expect(within(rowTitled('Rebuilding the rack')).getByRole('link', { name: 'Edit' })).toHaveAttribute(
			'href',
			'/studio/videos/1/edit',
		);
		expect(
			within(rowTitled('Untitled draft')).getByRole('link', { name: 'Continue upload' }),
		).toHaveAttribute('href', '/studio/upload');
	});

	it('opens the ffmpeg log drawer from a failed row, raw and unedited', async () => {
		const user = userEvent.setup();
		mount();
		await mountedRow('Overnight queue, second attempt');

		await user.click(
			within(rowTitled('Overnight queue, second attempt')).getByRole('button', { name: 'View log' }),
		);

		expect(screen.getByText('ffmpeg log — Overnight queue, second attempt')).toBeInTheDocument();
		const log = document.querySelector('.log') as HTMLElement;
		expect(log.textContent).toContain('Opening');
		expect(within(log).getByText('Error while filtering: Invalid argument')).toHaveClass('err');
		expect(within(log).getByText(/Opening/)).toHaveClass('dim');

		await user.click(screen.getByRole('button', { name: 'Close' }));
		expect(document.querySelector('.log')).toBeNull();
	});

	it('shows the empty state with the single upload action when there is nothing', async () => {
		server.use(
			http.get('/api/v1/video/my-channels', () => HttpResponse.json([])),
		);
		mount();

		expect(await screen.findByText('No videos on your channels yet')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Upload your first video' })).toHaveAttribute(
			'href',
			'/studio/upload',
		);
		expect(document.querySelector('table')).toBeNull();
	});

	it('polls every 10s only while a row is still pending', async () => {
		vi.useFakeTimers();
		try {
			const calls: string[] = [];
			let vodStatus: VideoProcessingStatus = 'processing';
			server.use(
				http.get('/api/v1/video/my-channels', ({ request }) => {
					const type = new URL(request.url).searchParams.get('type') ?? 'vod';
					calls.push(type);
					if (type === 'vod') {
						return HttpResponse.json([
							makeVideoListItem({ id: 3, processingStatus: vodStatus, isReleased: false }),
						]);
					}
					return HttpResponse.json([]);
				}),
			);
			mount();

			await act(async () => {
				await vi.advanceTimersByTimeAsync(10);
			});
			expect(calls.filter((t) => t === 'vod')).toHaveLength(1);
			expect(screen.getByText('Processing')).toBeInTheDocument();

			vodStatus = 'done'; // the encoder finished between polls
			await act(async () => {
				await vi.advanceTimersByTimeAsync(10_000);
			});
			expect(calls.filter((t) => t === 'vod')).toHaveLength(2);

			// idle now: no further refetch of either type
			await act(async () => {
				await vi.advanceTimersByTimeAsync(25_000);
			});
			expect(calls.filter((t) => t === 'vod')).toHaveLength(2);
			expect(calls.filter((t) => t === 'live')).toHaveLength(1);
		} finally {
			vi.useRealTimers();
		}
	});
});
