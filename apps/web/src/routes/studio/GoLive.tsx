import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { SecretField } from '../../components/SecretField';
import { VideoPlayer } from '../../components/player/VideoPlayer';
import { Field } from '../auth/Field';
import { api } from '../../lib/api';
import { myChannelId, useMe } from '../../lib/auth';
import { channelInitials } from '../../lib/format';
import { rtmpBase } from '../../lib/env';
import { zodResolver } from '../../lib/zodResolver';
import type { Video } from '../../types/api';

// Mirrors apps/api/src/video/dto/create-video.dto.ts — same lengths the server
// enforces — so the client never posts what the server rejects (Upload schema).
const metadataSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name is too long'),
	description: z
		.string()
		.min(8, 'Description must be at least 8 characters')
		.max(2048, 'Description is too long'),
});
type MetadataValues = z.infer<typeof metadataSchema>;

/** Component-local wizard: create → connect (key, waiting) → live ↔ reconnecting → ended. */
type Stage = 'create' | 'connect' | 'live' | 'reconnecting' | 'ended';

const STEPS = ['Create', 'Connect', 'Live'] as const;
// reconnecting is mid-broadcast: still the Live step
const STEP_OF: Record<Stage, number> = {
	create: 1,
	connect: 2,
	live: 3,
	reconnecting: 3,
	ended: 3,
};

/**
 * GET /video/live-by-video-id stops matching the key once the resume grace
 * window lapses — srsOnUnpublish flips isActive false with disconnectedAt
 * set, so past the window the answer becomes null — and the worker's later
 * `done`/failed writes land on that same dead row, so they mean "ended" here
 * too. Once the broadcast has started (liveStartedAt, set on first publish
 * and kept across resumes), the payload's liveState is authoritative:
 * 'reconnecting' = the encoder dropped inside the grace window. Before the
 * first publish isActive defaults true, so a fresh row is also labelled
 * 'live' — those flows derive from processingStatus instead.
 */
function streamStageOf(
	live: Video | null | undefined,
	answered: boolean,
): Exclude<Stage, 'create'> {
	if (live?.liveStartedAt != null) {
		if (live.liveState === 'live') return 'live';
		if (live.liveState === 'reconnecting') return 'reconnecting';
		if (live.liveState === 'ended') return 'ended';
	}
	if (
		answered &&
		(live == null || live.processingStatus === 'done' || live.processingStatus === 'failed_in_processing')
	) {
		return 'ended';
	}
	return live?.processingStatus === 'processing' ? 'live' : 'connect';
}

function clock(totalSeconds: number): string {
	const s = Math.max(0, Math.floor(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor(s / 60) % 60;
	const sec = s % 60;
	const mm = String(m).padStart(2, '0');
	const ss = String(sec).padStart(2, '0');
	return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function GoLive() {
	const me = useMe().data;
	const [video, setVideo] = useState<Video | null>(null);
	const [channelId, setChannelId] = useState<number>();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<MetadataValues>({ resolver: zodResolver(metadataSchema) });

	const create = useMutation({
		mutationFn: (values: MetadataValues) => {
			const id = channelId ?? (me ? myChannelId(me) : undefined);
			if (id == null) throw new Error('No channel to broadcast on');
			// the created live video's videoId IS the stream key
			return api.post<Video>('/api/v1/video', { ...values, channelId: id, type: 'live', tagIds: [] });
		},
		onSuccess: (created) => setVideo(created),
	});

	// public endpoint: no session needed, so it also works in a second tab
	const streamKey = video?.videoId ?? null;
	const live = useQuery({
		queryKey: ['live-stream', streamKey],
		queryFn: async () =>
			(await api.get<Video | null>(
				`/api/v1/video/live-by-video-id?videoId=${streamKey}`,
			)) ?? null,
		enabled: streamKey != null,
		// the polling lives in the query options (MyVideos pattern), never an
		// interval — it rides through 'reconnecting' and retires itself the
		// moment the stream ends
		refetchInterval: (query) =>
			streamStageOf(query.state.data, query.state.dataUpdatedAt > 0) === 'ended'
				? false
				: 15_000,
	});

	const stage: Stage = video == null ? 'create' : streamStageOf(live.data, live.dataUpdatedAt > 0);

	// elapsed clock: total broadcast age. Anchored on liveStartedAt (first
	// publish, kept across resumes — updatedAt, the pre-liveStartedAt
	// fallback, jumps on every write). The clock is state, written only from
	// callbacks — Date.now() during render is impure — and the 1s tick is a
	// display concern, not data polling.
	const [now, setNow] = useState<number | null>(null);
	useEffect(() => {
		// reconnecting is mid-broadcast: the clock keeps running through it
		if (stage !== 'live' && stage !== 'reconnecting') return;
		const sync = () => setNow(Date.now());
		const first = setTimeout(sync, 0); // resync the snapshot right after the flip
		const ticker = setInterval(sync, 1000);
		return () => {
			clearTimeout(first);
			clearInterval(ticker);
		};
	}, [stage]);

	// total-since-start anchor: the broadcast start when it exists, else the
	// last write (the pre-liveStartedAt fallback)
	const elapsedAnchor = live.data?.liveStartedAt ?? live.data?.updatedAt ?? null;

	if (!me) return <p className="page-sub">Loading…</p>;

	const channels = me.channels;
	const effectiveChannelId = channelId ?? myChannelId(me);
	const currentStep = STEP_OF[stage];

	return (
		<>
			<div className="page-head">
				<div>
					<h1>Go live</h1>
					<p className="page-sub">Create the stream, point your encoder at it, watch it go out</p>
				</div>
			</div>
			<div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
				<ol className="steps">
					{STEPS.map((label, index) => {
						const stepNumber = index + 1;
						return (
							<li
								key={label}
								data-done={stage === 'ended' || stepNumber < currentStep}
								aria-current={
									stepNumber === currentStep && stage !== 'ended' ? 'step' : undefined
								}
							>
								<span className="n">{stepNumber}</span>
								{label}
							</li>
						);
					})}
				</ol>

				{stage === 'create' && (
					<form
						onSubmit={handleSubmit((values) => create.mutate(values))}
						style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
					>
						<div>
							<h2 style={{ margin: 0, fontSize: 22 }}>Set up the stream</h2>
							<p className="page-sub">
								This creates a live video now; it stays unlisted until you start broadcasting.
							</p>
						</div>
						<Field htmlFor="gl-name" label="Name" error={errors.name?.message}>
							<input
								className="input"
								id="gl-name"
								aria-invalid={errors.name ? true : undefined}
								{...register('name')}
							/>
						</Field>
						<Field
							htmlFor="gl-desc"
							label="Description"
							error={errors.description?.message}
							hint={<p className="field-hint">Shown on the watch page once the stream is up.</p>}
						>
							<textarea
								className="input"
								id="gl-desc"
								rows={4}
								aria-invalid={errors.description ? true : undefined}
								{...register('description')}
							/>
						</Field>
						{channels.length > 1 && (
							<div className="field">
								<label>Channel</label>
								<div className="seg" role="group" aria-label="Channel">
									{channels.map((channel) => (
										<label key={channel.id} className="seg-opt">
											<input
												type="radio"
												name="gl-channel"
												checked={channel.id === effectiveChannelId}
												onChange={() => setChannelId(channel.id)}
											/>
											<span className="avatar avatar-sm">{channelInitials(channel.name)}</span>
											{channel.username}
										</label>
									))}
								</div>
								<p className="field-hint">Defaults to your current channel.</p>
							</div>
						)}
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<Link className="btn btn-ghost" to="/studio/videos">
								Cancel
							</Link>
							<button className="btn btn-primary" type="submit" disabled={create.isPending}>
								Create live video
							</button>
						</div>
						{create.isError && (
							<div className="toast toast-err" style={{ width: '100%' }} role="alert">
								<div>
									<div className="toast-title">Can't create the live video</div>
									<div className="toast-note">{create.error.message}</div>
									<div style={{ marginTop: 8 }}>
										<button
											className="btn btn-primary btn-sm"
											type="button"
											onClick={() => create.mutate(create.variables as MetadataValues)}
										>
											Try again
										</button>
									</div>
								</div>
							</div>
						)}
					</form>
				)}

				{stage === 'connect' && video?.videoId != null && (
					<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 22 }}>Point your encoder here</h2>
							<p className="page-sub">
								OBS: Settings → Stream → Custom — the URL below goes in <strong>Server</strong>,
								the key in <strong>Stream Key</strong>. Don't paste them into one field.
							</p>
						</div>
						<div className="field">
							<label htmlFor="gl-rtmp">Server URL</label>
							<div className="secret">
								<code id="gl-rtmp" className="mono">{rtmpBase()}</code>
								<button
									className="btn btn-ghost btn-sm"
									type="button"
									onClick={() => {
										navigator.clipboard?.writeText(rtmpBase()).catch(() => {});
									}}
								>
									Copy URL
								</button>
							</div>
						</div>
						<SecretField
							id="gl-key"
							label="Stream key"
							value={video.videoId}
							hint="Treat it like a password. This key is the live video's own ID — anyone holding it can broadcast to your channel, and it does not rotate."
						/>
						<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
							<span className="pill pill-queue">Waiting for your stream</span>
							<span
								className="mono"
								style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 'auto' }}
							>
								listening on 1935 · checked every 15 s
							</span>
						</div>
						<div
							style={{
								aspectRatio: '16 / 9',
								display: 'grid',
								placeItems: 'center',
								textAlign: 'center',
								padding: 12,
								borderRadius: 'var(--radius-md)',
								boxShadow: 'inset 0 0 0 1px var(--color-divider)',
								color: 'var(--color-muted)',
								fontSize: 13,
							}}
						>
							No signal yet. The preview starts the moment the encoder connects.
						</div>
					</section>
				)}

				{(stage === 'live' || stage === 'reconnecting') && video != null && live.data != null && (
					<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 22 }}>You're live</h2>
							{stage === 'reconnecting' ? (
								<>
									<div style={{ marginTop: 8 }}>
										<span className="pill pill-processing">Reconnecting — stream key held</span>
									</div>
									<p className="page-sub">
										Your encoder dropped. Reconnect within the grace window and the
										broadcast continues.
									</p>
								</>
							) : (
								<p className="page-sub">
									The watch page is serving this stream now. Stop your encoder to end it — the
									replay takes over on the same URL.
								</p>
							)}
						</div>
						{/* reconnecting keeps the self-monitor mounted: the stream
						    stalled at the edge and resumes when segments continue */}
						<VideoPlayer videoId={video.id} mode="live" />
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
								gap: 'var(--space-3)',
							}}
						>
							<div className="stat">
								<div className="stat-label">
									<span>Elapsed</span>
								</div>
								<div className="stat-value">
									<span className="mono">
										{clock(
											elapsedAnchor != null && now != null
												? (now - new Date(elapsedAnchor).getTime()) / 1000
												: 0,
										)}
									</span>
								</div>
							</div>
							<div className="stat">
								<div className="stat-label">
									<span>Viewers</span>
								</div>
								<div
									className="stat-value"
									style={{ fontSize: 17, color: 'var(--color-muted)' }}
								>
									Not reported
								</div>
								<div className="stat-note">the API doesn't count them</div>
							</div>
						</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<Link className="btn btn-secondary" to={`/watch/${video.id}`}>
								Open watch page
							</Link>
						</div>
					</section>
				)}

				{stage === 'ended' && video != null && (
					<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 22 }}>Stream ended</h2>
							<p className="page-sub">Same URL, now serving the replay — nothing to re-share.</p>
						</div>
						<div
							style={{
								borderRadius: 'var(--radius-md)',
								background: 'var(--color-surface)',
								boxShadow: 'var(--shadow-sm)',
								padding: 'var(--space-4)',
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--space-3)',
								flexWrap: 'wrap',
							}}
						>
							<div style={{ minWidth: 0, flex: '1 1 220px' }}>
								<div style={{ fontWeight: 500 }}>{video.name}</div>
								<div
									className="mono"
									style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}
								>
									{video.videoId ?? 'no key'}
								</div>
							</div>
							<Link className="btn btn-primary" to={`/watch/${video.id}`}>
								Watch the replay
							</Link>
						</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
							<button className="btn btn-secondary" type="button" onClick={() => setVideo(null)}>
								Start another stream
							</button>
						</div>
					</section>
				)}
			</div>
		</>
	);
}
