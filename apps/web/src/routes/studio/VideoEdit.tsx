import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Thumb } from '../../components/Thumb';
import { Field } from '../auth/Field';
import { api } from '../../lib/api';
import { videoThumbnailForm } from '../../lib/forms';
import { channelInitials } from '../../lib/format';
import { useVideo } from '../../hooks/useVideo';
import { zodResolver } from '../../lib/zodResolver';
import type { Video, WatchVideo } from '../../types/api';
import { SubtitleManager } from './SubtitleManager';
import { TagManager } from './TagManager';

// Mirrors apps/api/src/video/dto/update-video.dto.ts (via CreateVideoDto) —
// same lengths the server enforces on name/description.
const metadataSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name is too long'),
	description: z
		.string()
		.min(8, 'Description must be at least 8 characters')
		.max(2048, 'Description is too long'),
});
type MetadataValues = z.infer<typeof metadataSchema>;

/** Mounted only once the video is loaded, so defaultValues never shift under the form. */
function MetadataForm({ video }: { video: WatchVideo }) {
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<MetadataValues>({
		resolver: zodResolver(metadataSchema),
		defaultValues: { name: video.name, description: video.description },
	});

	const save = useMutation({
		mutationFn: (values: MetadataValues) => api.patch<Video>('/api/v1/video', { id: video.id, ...values }),
		onSuccess: (updated) => {
			toast.success('Changes saved');
			// server values become the new clean state
			reset({ name: updated.name, description: updated.description });
			void queryClient.invalidateQueries({ queryKey: ['video', video.id] });
			void queryClient.invalidateQueries({ queryKey: ['studio-videos'] });
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<form
			onSubmit={handleSubmit((values) => save.mutate(values))}
			style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
		>
			<Field htmlFor="ve-name" label="Name" error={errors.name?.message}>
				<input
					className="input"
					id="ve-name"
					aria-invalid={errors.name ? true : undefined}
					{...register('name')}
				/>
			</Field>
			<Field htmlFor="ve-desc" label="Description" error={errors.description?.message}>
				<textarea className="input" id="ve-desc" rows={4} {...register('description')} />
			</Field>
			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				<button
					className="btn btn-primary"
					type="submit"
					disabled={!isDirty || save.isPending}
				>
					Save changes
				</button>
			</div>
		</form>
	);
}

function ThumbnailSection({ video }: { video: WatchVideo }) {
	const queryClient = useQueryClient();

	const upload = useMutation({
		mutationFn: (file: File) =>
			api.patch<Video>('/api/v1/video/set-thumbnail', videoThumbnailForm(video.id, file)),
		onSuccess: () => {
			toast.success('Thumbnail updated');
			void queryClient.invalidateQueries({ queryKey: ['video', video.id] });
			void queryClient.invalidateQueries({ queryKey: ['studio-videos'] });
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<h6 style={{ margin: 0 }}>Thumbnail</h6>
			<div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
				<div className="vcard-thumb" style={{ width: 220, flex: 'none' }}>
					<Thumb
						seed={String(video.id)}
						initials={channelInitials(video.channel?.name)}
						file={video.thumbnailFile}
					/>
				</div>
				<div style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
					<p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
						Any image is re-encoded and stored at 1280×720.
					</p>
					<input
						type="file"
						aria-label="Thumbnail file"
						className="input"
						accept="image/*"
						style={{ maxWidth: 260 }}
						disabled={upload.isPending}
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) upload.mutate(file);
							e.target.value = '';
						}}
					/>
				</div>
			</div>
		</section>
	);
}

function DangerZone({ video }: { video: WatchVideo }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [confirming, setConfirming] = useState(false);

	const remove = useMutation({
		mutationFn: () => api.del<{ message: string }>(`/api/v1/video?id=${video.id}`),
		onSuccess: () => {
			toast.success('Video deleted');
			void queryClient.invalidateQueries({ queryKey: ['studio-videos'] });
			navigate('/studio/videos', { replace: true });
		},
		onError: (error) => toast.error(error.message),
	});

	// Escape closes the dialog like a native one would
	useEffect(() => {
		if (!confirming) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setConfirming(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [confirming]);

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<h6 style={{ margin: 0 }}>Danger zone</h6>
			<div className="card" style={{ boxShadow: 'inset 0 0 0 1px var(--color-accent-800)', gap: 'var(--space-3)' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
					<div style={{ flex: '1 1 260px', minWidth: 0 }}>
						<div style={{ fontWeight: 600, fontSize: 13 }}>Delete this video</div>
						<p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
							A soft delete: it disappears from every list and its files stay in storage until
							the operator prunes them.
						</p>
					</div>
					<button className="btn btn-danger" type="button" onClick={() => setConfirming(true)}>
						Delete video
					</button>
				</div>
			</div>

			{confirming && (
				<div
					className="dialog-backdrop"
					onClick={(e) => {
						if (e.target === e.currentTarget) setConfirming(false);
					}}
				>
					<div className="dialog" role="dialog" aria-modal="true" aria-labelledby="ve-del-title">
						<div className="dialog-title" id="ve-del-title">
							Delete “{video.name}”?
						</div>
						<div className="dialog-body">
							It will vanish from Browse, search, playlists and your studio list immediately. The
							files stay in storage, so an operator can still recover it from the database.
						</div>
						<div className="dialog-actions">
							<button className="btn btn-secondary" type="button" onClick={() => setConfirming(false)}>
								Keep it
							</button>
							<button
								className="btn btn-primary"
								type="button"
								disabled={remove.isPending}
								onClick={() => remove.mutate()}
							>
								Delete video
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}

export function VideoEdit() {
	const { id: idParam } = useParams();
	const id = Number(idParam);
	const videoQuery = useVideo(id);

	if (!Number.isInteger(id)) return <p className="page-sub">No such video.</p>;
	if (videoQuery.isError) return <p className="page-sub">Could not load this video.</p>;
	if (videoQuery.isPending) return <p className="page-sub">Loading…</p>;

	const video = videoQuery.data;

	return (
		<>
			<div className="page-head">
				<div>
					<Link className="btn btn-ghost btn-sm" to="/studio/videos">
						← My videos
					</Link>
					<h1 style={{ marginTop: 8 }}>Edit video</h1>
					<p className="page-sub">
						{video.type} · {video.videoId ?? 'no file yet'} ·{' '}
						{video.numberOfVisits?.toLocaleString() ?? 0} views
					</p>
				</div>
			</div>
			<div
				style={{
					maxWidth: 640,
					display: 'flex',
					flexDirection: 'column',
					gap: 'var(--space-8)',
				}}
			>
				<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
					<MetadataForm video={video} />
					<TagManager video={video} />
				</section>
				<ThumbnailSection video={video} />
				<SubtitleManager video={video} />
				<DangerZone video={video} />
			</div>
		</>
	);
}
