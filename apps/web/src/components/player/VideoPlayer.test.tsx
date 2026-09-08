import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../../test/render';
import { makeSubtitle, type Subtitle } from '../../test/fixtures';
import { VideoPlayer } from './VideoPlayer';

// ── hls.js mock ────────────────────────────────────────────────────────────
// Structural stand-in: only the surface VideoPlayer touches. Instances
// register themselves so tests can drive events and assert on engine calls.
const mock = vi.hoisted(() => {
	type Handler = (event: string, data: unknown) => void;
	class MockHls {
		static readonly Events = {
			MANIFEST_PARSED: 'hlsManifestParsed',
			LEVEL_SWITCHED: 'hlsLevelSwitched',
			SUBTITLE_TRACKS_UPDATED: 'hlsSubtitleTracksUpdated',
		};
		static readonly instances: MockHls[] = [];
		static isSupported = () => true;
		levels: { height: number; bitrate: number }[] = [];
		subtitleTracks: { id: number; lang: string; name?: string }[] = [];
		currentLevel = -1;
		subtitleTrack = -1;
		liveSyncPosition: number | null = null;
		loadSource = vi.fn();
		attachMedia = vi.fn();
		destroy = vi.fn();
		on = vi.fn();
		constructor() {
			MockHls.instances.push(this);
		}
		emit(event: string, data?: unknown) {
			for (const call of this.on.mock.calls as unknown as [string, Handler][]) {
				if (call[0] === event) call[1](event, data);
			}
		}
	}
	return { MockHls };
});

vi.mock('hls.js', () => ({ default: mock.MockHls, Hls: mock.MockHls }));

// Radix popper content needs these in jsdom.
beforeAll(() => {
	if (!('ResizeObserver' in globalThis)) {
		globalThis.ResizeObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
		};
	}
	if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
	mock.MockHls.instances.length = 0;
	vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
	vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

const hls = () => mock.MockHls.instances.at(-1)!;

function mount(props: Partial<Parameters<typeof VideoPlayer>[0]> = {}) {
	return renderWithApp(<VideoPlayer videoId={1} {...props} />);
}

function emitManifest(
	levels: { height: number; bitrate: number }[],
	subtitleTracks: { id: number; lang: string }[] = [],
) {
	const h = hls();
	h.levels = levels;
	h.subtitleTracks = subtitleTracks;
	act(() => {
		h.emit('hlsManifestParsed', {});
	});
}

function emitSwitched(level: number) {
	act(() => {
		hls().emit('hlsLevelSwitched', { level });
	});
}

const subtitles: Subtitle[] = [
	makeSubtitle({ id: 1, langRFC5646: 'en' }),
	makeSubtitle({ id: 2, langRFC5646: 'de' }),
];

// ── engine wiring ──────────────────────────────────────────────────────────

describe('VideoPlayer engine', () => {
	it('attaches hls.js and loads the proxied master playlist when native HLS is unavailable', () => {
		const { container } = mount({ subtitles: [] });

		expect(mock.MockHls.instances).toHaveLength(1);
		expect(hls().loadSource).toHaveBeenCalledWith('/storage/hls/1/master.m3u8');
		expect(hls().attachMedia).toHaveBeenCalledWith(container.querySelector('video'));
	});

	it('falls back to native playback (Safari) without constructing hls.js', () => {
		vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
		const { container } = mount({ subtitles: [] });

		expect(mock.MockHls.instances).toHaveLength(0);
		expect(container.querySelector('video')!.src).toContain('/storage/hls/1/master.m3u8');
	});

	it('destroys each hls.js instance across a double-mount cycle (what StrictMode does)', () => {
		// vitest runs NODE_ENV=test → React's production build, where <StrictMode>
		// no longer double-invokes effects — so the mount→cleanup→mount cycle it
		// exercises is reproduced explicitly here.
		const first = renderWithApp(
			<StrictMode>
				<VideoPlayer videoId={1} subtitles={[]} />
			</StrictMode>,
		);
		const firstEngine = hls();
		first.unmount();
		expect(firstEngine.destroy).toHaveBeenCalledTimes(1);

		const second = renderWithApp(
			<StrictMode>
				<VideoPlayer videoId={1} subtitles={[]} />
			</StrictMode>,
		);
		const secondEngine = hls();
		expect(mock.MockHls.instances).toHaveLength(2);
		expect(secondEngine).not.toBe(firstEngine);
		second.unmount();
		expect(secondEngine.destroy).toHaveBeenCalledTimes(1);
		expect(mock.MockHls.instances.every((h) => h.destroy.mock.calls.length === 1)).toBe(true);
	});
});

// ── quality menu ───────────────────────────────────────────────────────────

describe('quality menu', () => {
	it('lists Auto plus each level with its bitrate; selecting locks, Auto resets', async () => {
		const user = userEvent.setup();
		mount({ subtitles: [] });
		emitManifest(
			[
				{ height: 1080, bitrate: 5_000_000 },
				{ height: 720, bitrate: 2_800_000 },
				{ height: 360, bitrate: 800_000 },
			],
			[],
		);
		emitSwitched(1);

		await user.click(screen.getByRole('button', { name: 'Quality' }));
		const items = within(await screen.findByRole('menu')).getAllByRole('menuitemradio');
		expect(items.map((el) => el.textContent)).toEqual([
			'Auto720p',
			'1080p5.0 Mb/s',
			'720p2.8 Mb/s',
			'360p0.8 Mb/s',
		]);

		await user.click(items[2]); // 720p
		await waitFor(() => expect(hls().currentLevel).toBe(1));

		await user.click(screen.getByRole('button', { name: 'Quality' }));
		const reopened = within(await screen.findByRole('menu')).getAllByRole('menuitemradio');
		expect(reopened[2].getAttribute('aria-checked')).toBe('true');

		await user.click(reopened[0]); // Auto
		await waitFor(() => expect(hls().currentLevel).toBe(-1));
	});

	it('opens from the q key', async () => {
		mount({ subtitles: [] });
		emitManifest([{ height: 720, bitrate: 2_800_000 }]);

		fireEvent.keyDown(screen.getByRole('button', { name: 'Play' }).closest('.player')!, {
			key: 'q',
		});

		expect(await screen.findByRole('menu')).toBeInTheDocument();
	});
});

// ── keyboard map ───────────────────────────────────────────────────────────

describe('keyboard control', () => {
	it('space/k, arrows, j/l, digits, volume, mute — and announces state changes', () => {
		const playSpy = vi.mocked(HTMLMediaElement.prototype.play);
		const pauseSpy = vi.mocked(HTMLMediaElement.prototype.pause);
		const { container } = mount({ subtitles: [] });
		const root = container.querySelector('.player') as HTMLElement;
		const video = container.querySelector('video') as HTMLVideoElement;
		Object.defineProperty(video, 'duration', { value: 200, configurable: true });
		const live = container.querySelector('[aria-live="polite"]') as HTMLElement;

		video.currentTime = 100;
		fireEvent.keyDown(root, { key: ' ' });
		expect(playSpy).toHaveBeenCalledTimes(1);
		expect(live.textContent).toBe('Playing');

		Object.defineProperty(video, 'paused', { value: false, configurable: true });
		fireEvent.keyDown(root, { key: 'k' });
		expect(pauseSpy).toHaveBeenCalledTimes(1);
		expect(live.textContent).toBe('Paused');

		fireEvent.keyDown(root, { key: 'ArrowRight' });
		expect(video.currentTime).toBe(105);
		fireEvent.keyDown(root, { key: 'l' });
		expect(video.currentTime).toBe(115);
		fireEvent.keyDown(root, { key: 'j' });
		expect(video.currentTime).toBe(105);
		fireEvent.keyDown(root, { key: 'ArrowLeft' });
		expect(video.currentTime).toBe(100);
		fireEvent.keyDown(root, { key: '3' });
		expect(video.currentTime).toBe(60);

		video.volume = 0.5;
		fireEvent.keyDown(root, { key: 'ArrowUp' });
		expect(video.volume).toBe(0.6);
		fireEvent.keyDown(root, { key: 'ArrowDown' });
		expect(video.volume).toBe(0.5);

		fireEvent.keyDown(root, { key: 'm' });
		expect(video.muted).toBe(true);
		fireEvent.keyDown(root, { key: 'm' });
		expect(video.muted).toBe(false);
	});

	it('ignores keys while focus is in an input', () => {
		const playSpy = vi.mocked(HTMLMediaElement.prototype.play);
		const { container } = mount({ subtitles: [] });
		const root = container.querySelector('.player') as HTMLElement;
		const input = document.createElement('input');
		root.appendChild(input);

		fireEvent.keyDown(input, { key: ' ' });
		fireEvent.keyDown(input, { key: 'ArrowRight' });

		expect(playSpy).not.toHaveBeenCalled();
		expect((container.querySelector('video') as HTMLVideoElement).currentTime).toBe(0);
	});

	it('digit keys do not seek in live mode (percent of a live window is meaningless)', () => {
		const { container } = mount({ mode: 'live', subtitles: [] });
		const video = container.querySelector('video') as HTMLVideoElement;
		video.currentTime = 120;

		fireEvent.keyDown(container.querySelector('.player') as HTMLElement, { key: '5' });

		expect(video.currentTime).toBe(120);
	});

	it('q pressed before levels load does not auto-open the menu when they arrive', () => {
		mount({ subtitles: [] });
		fireEvent.keyDown(screen.getByRole('button', { name: 'Play' }).closest('.player')!, {
			key: 'q',
		});

		emitManifest([{ height: 720, bitrate: 2_800_000 }]);

		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Quality' })).toBeInTheDocument();
	});

	it('c toggles captions between off and the first track', () => {
		mount({ subtitles: [] });
		emitManifest([], [{ id: 0, lang: 'en' }]);

		fireEvent.keyDown(screen.getByRole('button', { name: 'Play' }).closest('.player')!, {
			key: 'c',
		});
		expect(hls().subtitleTrack).toBe(0);

		fireEvent.keyDown(screen.getByRole('button', { name: 'Play' }).closest('.player')!, {
			key: 'c',
		});
		expect(hls().subtitleTrack).toBe(-1);
	});
});

// ── modes ──────────────────────────────────────────────────────────────────

describe('modes', () => {
	it('vod shows the scrub bar', () => {
		const { container } = mount({ mode: 'vod', subtitles: [] });
		expect(container.querySelector('.player-scrub')).toBeInTheDocument();
		expect(screen.queryByText('This stream has ended')).not.toBeInTheDocument();
	});

	it('live drops the scrub, shows the LIVE pill, elapsed time and jump-to-live', () => {
		const { container } = mount({ mode: 'live', subtitles: [] });
		const video = container.querySelector('video') as HTMLVideoElement;

		expect(container.querySelector('.player-scrub')).not.toBeInTheDocument();
		expect(screen.getByText('Live', { selector: '.pill-live' })).toBeInTheDocument();

		video.currentTime = 2472; // 41:12 since the window start
		fireEvent(video, new Event('timeupdate'));
		expect(screen.getByText('41:12')).toBeInTheDocument();
		expect(screen.getByText('LIVE')).toBeInTheDocument();

		hls().liveSyncPosition = 3000;
		fireEvent.click(screen.getByRole('button', { name: 'Jump to live' }));
		expect(video.currentTime).toBe(3000);
	});

	it('replay keeps vod controls and adds the ended notice', () => {
		const { container } = mount({ mode: 'replay', subtitles: [] });

		expect(container.querySelector('.player-scrub')).toBeInTheDocument();
		expect(screen.getByText('This stream has ended')).toBeInTheDocument();
	});
});

// ── subtitles ──────────────────────────────────────────────────────────────

describe('subtitles', () => {
	it('dedupes by language with manifest tracks winning — they carry the cues', async () => {
		const user = userEvent.setup();
		const { container } = mount({ subtitles }); // API: en, de
		emitManifest([], [
			{ id: 0, lang: 'en' },
			{ id: 1, lang: 'sv' },
		]);

		// 'en' collides → the manifest track owns it; only the API-only 'de'
		// still renders a native track.
		const tracks = container.querySelectorAll('track');
		expect(tracks).toHaveLength(1);
		expect(Array.from(tracks).map((t) => t.getAttribute('srcLang'))).toEqual(['de']);

		await user.click(screen.getByRole('button', { name: 'Subtitles' }));
		const menu = await screen.findByRole('menu');
		expect(within(menu).getAllByText('English')).toHaveLength(1);
		expect(
			within(menu)
				.getAllByRole('menuitemradio')
				.map((el) => el.textContent),
		).toEqual(['Off', 'Englishen', 'Swedishsv', 'Germande']);

		// Collision language selects the hls index (cues stay on); a
		// manifest-only and an API-only language behave as before.
		await user.click(within(screen.getByRole('menu')).getAllByRole('menuitemradio')[1]); // English
		await waitFor(() => expect(hls().subtitleTrack).toBe(0));
		await user.click(screen.getByRole('button', { name: 'Subtitles' }));
		await user.click(within(screen.getByRole('menu')).getAllByRole('menuitemradio')[2]); // Swedish
		await waitFor(() => expect(hls().subtitleTrack).toBe(1));
		await user.click(screen.getByRole('button', { name: 'Subtitles' }));
		await user.click(within(screen.getByRole('menu')).getAllByRole('menuitemradio')[3]); // German
		await waitFor(() => expect(hls().subtitleTrack).toBe(-1));
		await user.click(screen.getByRole('button', { name: 'Subtitles' }));
		await user.click(within(screen.getByRole('menu')).getAllByRole('menuitemradio')[0]); // Off
		await waitFor(() => expect(hls().subtitleTrack).toBe(-1));
	});

	it('fetches GET /subtitle/by-video-id when no subtitles are passed in', async () => {
		const { container } = mount();

		await waitFor(() => expect(container.querySelectorAll('track')).toHaveLength(2));
	});
});

// ── watched beacon callback ────────────────────────────────────────────────

describe('onWatched callback', () => {
	it('fires once when playback crosses 30s, not before and not twice', () => {
		const onWatched = vi.fn();
		const { container } = mount({ subtitles: [], onWatched });
		const video = container.querySelector('video') as HTMLVideoElement;

		const tick = (seconds: number) => {
			video.currentTime = seconds;
			fireEvent(video, new Event('timeupdate'));
		};

		tick(10);
		tick(29.9);
		expect(onWatched).not.toHaveBeenCalled();

		tick(30);
		tick(31);
		tick(45);
		expect(onWatched).toHaveBeenCalledTimes(1);
	});
});
