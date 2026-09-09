import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';
import { UploadProgress } from '../../components/upload/progress';
import { Dropzone } from '../../components/upload/Dropzone';
import { Field } from '../auth/Field';
import { ApiError, api } from '../../lib/api';
import { myChannelId, useMe } from '../../lib/auth';
import { channelInitials } from '../../lib/format';
import { putToPresignedUrl } from '../../lib/upload';
import { zodResolver } from '../../lib/zodResolver';
import type { Video } from '../../types/api';

// Mirrors apps/api/src/video/dto/create-video.dto.ts — same lengths the server
// enforces — so the client never posts what the server rejects.
const metadataSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name is too long'),
	description: z
		.string()
		.min(8, 'Description must be at least 8 characters')
		.max(2048, 'Description is too long'),
});
type MetadataValues = z.infer<typeof metadataSchema>;

/** Component-local state machine: idle → creating → uploading → confirming → queueing → done | error. */
type RunStep = 'creating' | 'uploading' | 'confirming' | 'queueing';
type Phase = 'idle' | RunStep | 'done' | 'error';

const STEPS = ['Metadata', 'File', 'Confirm', 'Queue'] as const;
const STEP_OF: Record<Exclude<Phase, 'idle' | 'error'>, number> = {
	creating: 2,
	uploading: 2,
	confirming: 3,
	queueing: 4,
	done: 4,
};
const PHASE_NOTE: Record<RunStep, string> = {
	creating: 'creating the video record…',
	uploading: 'uploading straight to storage…',
	confirming: 'confirming the upload…',
	queueing: 'sending to the processing queue…',
};

export function Upload() {
	const me = useMe().data;
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	// ?videoId= resumes an abandoned ready_for_upload row: metadata already
	// exists, so the run starts at the file step and skips POST /video.
	const resumeVideoId = Number(searchParams.get('videoId')) || null;

	const [phase, setPhase] = useState<Phase>('idle');
	const [error, setError] = useState<{ from: RunStep; title: string; note: string } | null>(null);
	const [videoId, setVideoId] = useState<number | null>(resumeVideoId);
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
	const [metadataDone, setMetadataDone] = useState(resumeVideoId != null);
	const [channelId, setChannelId] = useState<number>();
	const [values, setValues] = useState<MetadataValues | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<MetadataValues>({ resolver: zodResolver(metadataSchema) });

	useEffect(() => {
		if (phase === 'done') navigate('/studio/videos', { replace: true });
	}, [phase, navigate]);

	// leaving the page mid-PUT abandons the request (the video row survives)
	useEffect(() => () => abortRef.current?.abort(), []);

	if (!me) return <p className="page-sub">Loading…</p>;

	const channels = me.channels;
	const effectiveChannelId = channelId ?? myChannelId(me);

	const fail = (from: RunStep, title: string, note: string) => {
		setError({ from, title, note });
		setPhase('error');
	};

	/** Runs the machine from `from` to done; 404-at-confirm and 400-at-queue stop in their designed error states. */
	const run = async (from: RunStep, picked: File) => {
		setError(null);
		let step = from;
		let id = videoId;
		try {
			if (step === 'creating') {
				setPhase('creating');
				if (!values || effectiveChannelId == null) throw new Error('Missing upload metadata');
				const video = await api.post<Video>('/api/v1/video', {
					...values,
					channelId: effectiveChannelId,
					type: 'vod', // this wizard is the VOD path; live is Go live
					tagIds: [],
				});
				id = video.id;
				setVideoId(id);
				step = 'uploading';
			}
			if (step === 'uploading') {
				setPhase('uploading');
				const { url } = await api.get<{ url: string }>(
					`/api/v1/video/get-presigned-put-url?id=${id}&path=${encodeURIComponent(picked.name)}`,
				);
				abortRef.current = new AbortController();
				await putToPresignedUrl(url, picked, (loaded, total) => setProgress({ loaded, total }), abortRef.current.signal);
				// the bar must land at 100% even if storage never sent progress events
				setProgress({ loaded: picked.size, total: picked.size });
				step = 'confirming';
			}
			if (step === 'confirming') {
				setPhase('confirming');
				try {
					await api.post<{ message: string }>('/api/v1/video/confirm-upload', { id });
				} catch (e) {
					if (e instanceof ApiError && e.status === 404) {
						return fail(
							'confirming',
							'Upload not found (404)',
							'The object isn’t in storage yet. Give storage a moment, then retry the confirm.',
						);
					}
					throw e;
				}
				step = 'queueing';
			}
			setPhase('queueing');
			try {
				await api.post<{ message: string }>('/api/v1/video/send-video-to-process-queue', { id });
			} catch (e) {
				if (e instanceof ApiError && e.status === 400) {
					return fail(
						'queueing',
						'Can’t queue this video (400)',
						'The upload hasn’t been confirmed yet. Retry the queue once it is.',
					);
				}
				throw e;
			}
			setPhase('done');
		} catch (e) {
			fail(step, 'Upload failed', e instanceof Error ? e.message : 'Something went wrong');
		}
	};

	const onFile = (picked: File) => {
		setFile(picked);
		setProgress({ loaded: 0, total: picked.size });
		void run(videoId != null ? 'uploading' : 'creating', picked);
	};

	const retry = () => {
		if (error && file) void run(error.from, file);
	};

	const currentStep = error
		? STEP_OF[error.from]
		: phase === 'idle'
			? metadataDone
				? 2
				: 1
			: STEP_OF[phase];
	const retryLabel =
		error?.from === 'confirming'
			? 'Retry confirm'
			: error?.from === 'queueing'
				? 'Retry queue'
				: 'Try again';

	return (
		<>
			<div className="page-head">
				<div>
					<h1>Upload a video</h1>
					<p className="page-sub">Straight to storage, then through the pipeline</p>
				</div>
			</div>
			<div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
				<ol className="steps">
					{STEPS.map((label, index) => {
						const stepNumber = index + 1;
						return (
							<li
								key={label}
								data-done={phase === 'done' || stepNumber < currentStep}
								aria-current={
									stepNumber === currentStep && phase !== 'done' ? 'step' : undefined
								}
							>
								<span className="n">{stepNumber}</span>
								{label}
							</li>
						);
					})}
				</ol>

				{phase === 'idle' && !metadataDone && (
					<form
						onSubmit={handleSubmit((next) => {
							setValues(next);
							setMetadataDone(true);
						})}
						style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
					>
						<div>
							<h2 style={{ margin: 0, fontSize: 22 }}>Describe the video</h2>
							<p className="page-sub">Metadata is created first — the upload attaches to it.</p>
						</div>
						<Field htmlFor="up-name" label="Name" error={errors.name?.message}>
							<input
								className="input"
								id="up-name"
								aria-invalid={errors.name ? true : undefined}
								{...register('name')}
							/>
						</Field>
						<Field
							htmlFor="up-desc"
							label="Description"
							error={errors.description?.message}
							hint={<p className="field-hint">Searchable along with the name. Up to 2,048 characters.</p>}
						>
							<textarea
								className="input"
								id="up-desc"
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
												name="up-channel"
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
							<button className="btn btn-primary" type="submit">
								Continue to file
							</button>
						</div>
					</form>
				)}

				{(metadataDone || phase !== 'idle') && phase !== 'done' && (
					<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: 22 }}>Add the file</h2>
							<p className="page-sub">
								Uploaded straight to storage with a presigned URL — it never passes through the API.
							</p>
						</div>
						{resumeVideoId != null && !file && (
							<p className="field-hint">
								Continuing an unfinished upload — its saved name and description are kept.
							</p>
						)}
						{!file ? (
							<>
								<Dropzone onFile={onFile} hint="mp4, mkv or mov" />
								<p className="field-hint">
									The presigned upload link is valid for one hour — pick the file again if it expires.
								</p>
							</>
						) : (
							<>
								<UploadProgress
									file={file.name}
									loaded={progress?.loaded ?? 0}
									total={progress?.total ?? file.size}
								/>
								{phase !== 'idle' && phase !== 'error' && (
									<p className="stat-note" role="status">
										{PHASE_NOTE[phase]}
									</p>
								)}
							</>
						)}
						{phase === 'error' && error && (
							<div className="toast toast-err" style={{ width: '100%' }} role="alert">
								<div>
									<div className="toast-title">{error.title}</div>
									<div className="toast-note">{error.note}</div>
									<div className="toast-note">
										Nothing is lost — unfinished uploads stay in{' '}
										<Link to="/studio/videos">My videos</Link> as Ready for upload and can be
										continued there.
									</div>
									<div style={{ marginTop: 8 }}>
										<button className="btn btn-primary btn-sm" type="button" onClick={retry}>
											{retryLabel}
										</button>
									</div>
								</div>
							</div>
						)}
					</section>
				)}
			</div>
		</>
	);
}
