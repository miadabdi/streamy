import { useQuery } from '@tanstack/react-query';
import Hls from 'hls.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { api } from '../../lib/api';
import { storageBase } from '../../lib/env';
import type { Subtitle } from '../../types/api';
import { FullscreenIcon, LiveIcon, PauseIcon, PlayIcon } from '../icons';
import { handlePlayerKey, type PlayerCommands } from './keyboard';
import {
	QualityMenu,
	SubtitleMenu,
	type QualityLevel,
	type SubtitleOption,
} from './menus';

export type PlayerMode = 'vod' | 'live' | 'replay';

const visuallyHidden = {
	position: 'absolute',
	width: 1,
	height: 1,
	padding: 0,
	margin: -1,
	overflow: 'hidden',
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	whiteSpace: 'nowrap',
	border: 0,
} as const;

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const s = Math.floor(seconds % 60);
	const m = Math.floor(seconds / 60) % 60;
	const h = Math.floor(seconds / 3600);
	const mm = String(m).padStart(2, '0');
	const ss = String(s).padStart(2, '0');
	return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

const languageNames = (() => {
	try {
		return new Intl.DisplayNames(['en'], { type: 'language' });
	} catch {
		return null;
	}
})();

function languageLabel(lang: string): string {
	try {
		return languageNames?.of(lang) ?? lang;
	} catch {
		return lang;
	}
}

type HlsSubtitleTrack = { id: number; lang: string; name?: string };

/** POST /video/watched beacon threshold: playback position that counts as watched. */
const WATCHED_AFTER_S = 30;

/**
 * The centerpiece surface (Nocturne/templates/watch/Watch.dc.html): hls.js
 * playback with quality/subtitle menus, full keyboard control and a live
 * region, switching between vod, live and replay chrome.
 */
export function VideoPlayer({
	videoId,
	mode = 'vod',
	subtitles,
	onWatched,
}: {
	videoId: number;
	mode?: PlayerMode;
	/** Pass fetched rows to skip GET /subtitle/by-video-id. */
	subtitles?: Subtitle[];
	/** Fires once per video after WATCHED_AFTER_S of playback position (vod:
	 *  currentTime, live: DVR-window elapsed). Seeking past it also fires. */
	onWatched?: () => void;
}) {
	const [playing, setPlaying] = useState(false);
	const [current, setCurrent] = useState(0);
	const [duration, setDuration] = useState(0);
	const [elapsed, setElapsed] = useState(0); // live: time since the window start
	const [levels, setLevels] = useState<QualityLevel[]>([]);
	const [lockedLevel, setLockedLevel] = useState(-1); // hls.currentLevel, -1 = Auto
	const [activeHeight, setActiveHeight] = useState<number | undefined>();
	const [hlsSubTracks, setHlsSubTracks] = useState<HlsSubtitleTrack[]>([]);
	const [selectedSub, setSelectedSub] = useState<string | null>(null);
	const [qualityOpen, setQualityOpen] = useState(false);
	const [subtitlesOpen, setSubtitlesOpen] = useState(false);
	// n re-keys the live-region node so identical text (e.g. "Paused" twice)
	// still reads as new content to screen readers.
	const [announcement, setAnnouncement] = useState<{ text: string; n: number }>({
		text: '',
		n: 0,
	});

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const hlsRef = useRef<Hls | null>(null);
	const qualityTriggerRef = useRef<HTMLButtonElement | null>(null);
	// the media-element effect is mount-scoped, so the beacon callback reaches
	// it through a ref instead of a stale first-render closure
	const watchedFiredRef = useRef(false);
	const onWatchedRef = useRef(onWatched);

	useEffect(() => {
		onWatchedRef.current = onWatched;
	});

	const { data: fetched } = useQuery({
		queryKey: ['subtitles', videoId],
		queryFn: () => api.get<Subtitle[]>(`/api/v1/subtitle/by-video-id?videoId=${videoId}`),
		enabled: subtitles === undefined,
	});
	const apiSubtitles = useMemo(() => subtitles ?? fetched ?? [], [subtitles, fetched]);

	// ── engine wiring ────────────────────────────────────────────────────────
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		watchedFiredRef.current = false; // fresh video → the beacon may fire again
		const src = `${storageBase()}/hls/${videoId}/master.m3u8`;
		// StrictMode double-mount: `disposed` guards setState from the destroyed
		// instance's late events; the cleanup destroys it (plan risk #6).
		let disposed = false;
		let hls: Hls | null = null;

		// Prefer MSE/hls.js whenever available — `canPlayType` returns 'maybe'
		// for mpegurl on some Chromium builds whose native playback handles
		// video but not WebVTT-in-HLS (subtitles + quality menus silently
		// missing). Native HLS is only the fallback for browsers without MSE
		// (old iOS Safari); modern Safari has MSE and takes the hls.js path.
		if (Hls.isSupported()) {
			hls = new Hls();
			hlsRef.current = hls;
			hls.loadSource(src);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				if (disposed || !hls) return;
				setLevels(
					hls.levels.map((l) => ({ height: l.height ?? 0, bitrate: l.bitrate ?? 0 })),
				);
				setHlsSubTracks(hls.subtitleTracks.map((t, i) => ({ id: i, lang: t.lang, name: t.name })));
				video.play()?.catch(() => {});
			});
			hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
				if (disposed || !hls) return;
				setHlsSubTracks(hls.subtitleTracks.map((t, i) => ({ id: i, lang: t.lang, name: t.name })));
			});
			hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
				if (disposed || !hls) return;
				setActiveHeight(hls.levels[data.level]?.height);
			});
			// hls.js treats a 404 manifest as fatal with no retry — but the live
			// self-monitor mounts the moment the publish flips, often before
			// ffmpeg has written master.m3u8. Keep retrying while live (bounded).
			let manifestRetries = 0;
			hls.on(Hls.Events.ERROR, (_event, data) => {
				if (disposed || !hls) return;
				const manifestMissing =
					data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
					data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT;
				if (data.fatal && manifestMissing && mode === 'live' && manifestRetries < 40) {
					manifestRetries += 1;
					setTimeout(() => {
						if (!disposed && hlsRef.current === hls) hls.loadSource(src);
					}, 3000);
				}
			});
		} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = src; // native HLS fallback (no MSE)
		} else {
			video.src = src; // last resort: let the browser try
		}

		return () => {
			disposed = true;
			hls?.destroy();
			hlsRef.current = null;
		};
	}, [videoId]);

	// ── media element state ──────────────────────────────────────────────────
	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;
		const onTime = () => {
			setCurrent(video.currentTime);
			const seekable = video.seekable;
			const position = video.currentTime - (seekable.length > 0 ? seekable.start(0) : 0);
			setElapsed(position);
			if (!watchedFiredRef.current && position >= WATCHED_AFTER_S) {
				watchedFiredRef.current = true;
				onWatchedRef.current?.();
			}
		};
		const onDuration = () => setDuration(Number.isFinite(video.duration) ? video.duration : 0);
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		video.addEventListener('timeupdate', onTime);
		video.addEventListener('loadedmetadata', onDuration);
		video.addEventListener('durationchange', onDuration);
		video.addEventListener('play', onPlay);
		video.addEventListener('pause', onPause);
		return () => {
			video.removeEventListener('timeupdate', onTime);
			video.removeEventListener('loadedmetadata', onDuration);
			video.removeEventListener('durationchange', onDuration);
			video.removeEventListener('play', onPlay);
			video.removeEventListener('pause', onPause);
		};
	}, []);

	// ── subtitle options: manifest tracks merged with API rows, deduped by lang
	const subOptions = useMemo<SubtitleOption[]>(() => {
		// Manifest tracks win collisions: they are the only entries carrying
		// cues (the worker muxes every uploaded subtitle into the master
		// playlist); API rows fill languages the manifest lacks.
		const byLang = new Map<string, SubtitleOption>();
		for (const t of hlsSubTracks) {
			const lang = t.lang.toLowerCase();
			if (byLang.has(lang)) continue;
			byLang.set(lang, {
				key: `hls:${t.id}`,
				label: t.name || languageLabel(t.lang),
				lang: t.lang,
				hlsIndex: t.id,
			});
		}
		for (const s of apiSubtitles) {
			const lang = s.langRFC5646.toLowerCase();
			if (byLang.has(lang)) continue;
			byLang.set(lang, {
				key: `api:${s.id}`,
				label: languageLabel(s.langRFC5646),
				lang: s.langRFC5646,
				hlsIndex: null,
			});
		}
		return [...byLang.values()];
	}, [apiSubtitles, hlsSubTracks]);

	// ponytail: API subtitle rows carry no playable URL (the worker muxes them
	// into the manifest as sub_vtt_<lang>.m3u8), so these native tracks are
	// srcless — they contribute language/label to the menu; cue data still
	// arrives via the manifest in both hls.js and Safari-native modes.
	const nativeTracks = subOptions.filter((o) => o.hlsIndex === null);

	const isLive = mode === 'live';

	const announce = (message: string) =>
		setAnnouncement((previous) => ({ text: message, n: previous.n + 1 }));

	const commands: PlayerCommands = {
		togglePlay() {
			const video = videoRef.current;
			if (!video) return;
			if (video.paused) {
				video.play()?.catch(() => {});
				announce('Playing');
			} else {
				video.pause();
				announce('Paused');
			}
		},
		seekBy(delta) {
			const video = videoRef.current;
			if (!video) return;
			const max = Number.isFinite(video.duration) ? video.duration : Number.POSITIVE_INFINITY;
			video.currentTime = Math.min(Math.max(0, video.currentTime + delta), max);
			announce(`Seeked to ${formatTime(video.currentTime)}`);
		},
		seekToRatio(ratio) {
			const video = videoRef.current;
			if (!video) return;
			// percent-seek is meaningless against a live window — a digit would
			// otherwise hurl the viewer back to the DVR window start
			if (isLive || !Number.isFinite(video.duration) || video.duration <= 0) return;
			video.currentTime = video.duration * ratio;
			announce(`Seeked to ${formatTime(video.currentTime)}`);
		},
		nudgeVolume(delta) {
			const video = videoRef.current;
			if (!video) return;
			const volume = Math.round((video.volume + delta) * 100) / 100;
			video.volume = Math.min(1, Math.max(0, volume));
			if (video.volume > 0) video.muted = false;
			announce(`Volume ${Math.round(video.volume * 100)}%`);
		},
		toggleMute() {
			const video = videoRef.current;
			if (!video) return;
			video.muted = !video.muted;
			announce(video.muted ? 'Muted' : 'Unmuted');
		},
		toggleFullscreen() {
			if (document.fullscreenElement) {
				document.exitFullscreen?.();
				return;
			}
			const root = rootRef.current;
			if (root?.requestFullscreen) {
				root.requestFullscreen();
				announce('Fullscreen');
			}
		},
		toggleCaptions() {
			const video = videoRef.current;
			if (!video) return;
			const showing =
				(hlsRef.current?.subtitleTrack ?? -1) !== -1 ||
				Array.from(video.textTracks ?? []).some((t) => t.mode === 'showing');
			selectSubtitle(showing ? null : (subOptions[0] ?? null));
		},
		openQualityMenu() {
			// no levels → no menu mounted; opening "later" when levels arrive
			// would auto-pop it without a fresh key press
			if (levels.length === 0) return;
			qualityTriggerRef.current?.focus();
			setQualityOpen(true);
		},
	};

	function selectSubtitle(option: SubtitleOption | null) {
		const hls = hlsRef.current;
		if (hls) hls.subtitleTrack = option?.hlsIndex ?? -1;
		const video = videoRef.current;
		if (video) {
			for (const track of Array.from(video.textTracks ?? [])) {
				track.mode = option !== null && track.language === option.lang ? 'showing' : 'disabled';
			}
		}
		setSelectedSub(option?.key ?? null);
		announce(option ? `Captions: ${option.label}` : 'Captions off');
	}

	function selectLevel(level: number) {
		const hls = hlsRef.current;
		if (!hls) return;
		hls.currentLevel = level;
		setLockedLevel(level);
		announce(level === -1 ? 'Quality: Auto' : `Quality: ${hls.levels[level]?.height ?? '?'}p`);
	}

	function jumpToLive() {
		const video = videoRef.current;
		if (!video) return;
		const seekable = video.seekable;
		const target =
			hlsRef.current?.liveSyncPosition ??
			(seekable.length > 0 ? seekable.end(seekable.length - 1) : undefined);
		if (target !== undefined && Number.isFinite(target)) video.currentTime = target;
		announce('Jumped to live');
	}

	function seekFromScrub(event: ReactMouseEvent<HTMLDivElement>) {
		const video = videoRef.current;
		if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
		const rect = event.currentTarget.getBoundingClientRect();
		if (rect.width <= 0) return;
		video.currentTime = ((event.clientX - rect.left) / rect.width) * video.duration;
	}

	function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
		handlePlayerKey(event.nativeEvent, commands);
	}

	return (
		<>
			<div
				ref={rootRef}
				className="player"
				tabIndex={0}
				role="region"
				aria-label="Video player"
				onKeyDown={onKeyDown}
			>
				<video
					ref={videoRef}
					playsInline
					/* click the surface to toggle play — the control bar sits above and swallows its own clicks */
					onClick={commands.togglePlay}
					style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
				>
					{nativeTracks.map((t) => (
						<track key={t.key} kind="subtitles" srcLang={t.lang} label={t.label} />
					))}
				</video>

				{isLive && (
					<span
						className="pill pill-live"
						style={{ position: 'absolute', left: 12, top: 12 }}
					>
						Live
					</span>
				)}

				<div className="player-bar">
					<button
						className="player-btn"
						type="button"
						aria-label={playing ? 'Pause' : 'Play'}
						onClick={commands.togglePlay}
					>
						{playing ? <PauseIcon width={15} height={15} /> : <PlayIcon width={15} height={15} />}
					</button>
					<span className="player-time">
						{isLive ? formatTime(elapsed) : formatTime(current)}
					</span>
					{!isLive && (
						<div className="player-scrub" onClick={seekFromScrub}>
							<i style={{ width: `${duration > 0 ? (current / duration) * 100 : 0}%` }} />
						</div>
					)}
					<span className="player-time">{isLive ? 'LIVE' : formatTime(duration)}</span>
					{isLive && (
						<button
							className="player-btn"
							type="button"
							aria-label="Jump to live"
							onClick={jumpToLive}
						>
							<LiveIcon width={15} height={15} />
						</button>
					)}
					<SubtitleMenu
						options={subOptions}
						selected={selectedSub}
						open={subtitlesOpen}
						onOpenChange={setSubtitlesOpen}
						onSelect={(option) => selectSubtitle(option)}
					/>
					{levels.length > 0 && (
						<QualityMenu
							levels={levels}
							locked={lockedLevel}
							activeHeight={activeHeight}
							open={qualityOpen}
							onOpenChange={setQualityOpen}
							onSelect={selectLevel}
							triggerRef={qualityTriggerRef}
						/>
					)}
					<button
						className="player-btn"
						type="button"
						aria-label="Fullscreen"
						onClick={commands.toggleFullscreen}
					>
						<FullscreenIcon width={16} height={16} />
					</button>
				</div>

				<span aria-live="polite" style={visuallyHidden}>
					<span key={announcement.n}>{announcement.text}</span>
				</span>
			</div>

			{mode === 'replay' && (
				<div className="toast" style={{ width: '100%', background: 'var(--color-surface)' }}>
					<div>
						<div className="toast-title">This stream has ended</div>
						<div className="toast-note">The replay is on the same URL — nothing to re-share.</div>
					</div>
				</div>
			)}
		</>
	);
}
