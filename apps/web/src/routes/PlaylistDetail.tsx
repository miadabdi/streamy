import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { VideoGrid } from '../components/VideoGrid';
import { Field } from './auth/Field';
import { useDebounced } from '../hooks/useDebounced';
import { useVideoSearch } from '../hooks/useVideos';
import { api } from '../lib/api';
import { zodResolver } from '../lib/zodResolver';
import type { Playlist, VideoListItem } from '../types/api';

// Same lengths CreatePlaylistDto enforces (UpdatePlaylistDto is its partial).
const editSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(256, 'Name is too long'),
	description: z
		.string()
		.min(8, 'Description must be at least 8 characters')
		.max(2048, 'Description is too long'),
});
type EditValues = z.infer<typeof editSchema>;

function isSystem(playlist: Playlist): boolean {
	return playlist.type != null && playlist.type !== 'custom';
}

// by-id embeds video + thumbnailFile only; VideoCard wants the list-item shape
// (no channel/videoFile to offer — the card just skips those lines).
function toCardVideo(video: NonNullable<Playlist['playlistsVideos']>[number]['video']): VideoListItem {
	return { ...video, channel: null, videoFile: null };
}

/** Mounted only once the playlist is loaded, so defaultValues never shift under the form. */
function DetailsCard({ playlist }: { playlist: Playlist }) {
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<EditValues>({
		resolver: zodResolver(editSchema),
		defaultValues: { name: playlist.name, description: playlist.description },
	});

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['playlist', playlist.id] });
		void queryClient.invalidateQueries({ queryKey: ['playlists'] });
	};

	const save = useMutation({
		mutationFn: (values: EditValues) =>
			api.patch<Playlist>('/api/v1/playlist', { id: playlist.id, ...values }),
		onSuccess: (updated) => {
			toast.success('Changes saved');
			// server values become the new clean state
			reset({ name: updated.name, description: updated.description });
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	const togglePrivacy = useMutation({
		mutationFn: (privacy: 'public' | 'private') =>
			api.patch<Playlist>('/api/v1/playlist', { id: playlist.id, privacy }),
		onSuccess: () => {
			toast.success('Privacy updated');
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<section
			className="card"
			style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
		>
			<form
				onSubmit={handleSubmit((values) => save.mutate(values))}
				style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
			>
				<Field htmlFor="pd-name" label="Name" error={errors.name?.message}>
					<input
						className="input"
						id="pd-name"
						aria-invalid={errors.name ? true : undefined}
						{...register('name')}
					/>
				</Field>
				<Field htmlFor="pd-desc" label="Description" error={errors.description?.message}>
					<textarea
						className="input"
						id="pd-desc"
						rows={4}
						aria-invalid={errors.description ? true : undefined}
						{...register('description')}
					/>
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
			<label className="switch">
				<input
					type="checkbox"
					checked={playlist.privacy === 'public'}
					onChange={(e) => togglePrivacy.mutate(e.target.checked ? 'public' : 'private')}
					disabled={togglePrivacy.isPending}
				/>
				<span className="track" />
				Public
			</label>
			<p className="field-hint" style={{ margin: 0 }}>
				Public playlists show on your channel page. Private ones stay visible only to you.
			</p>
		</section>
	);
}

function AddVideos({ playlist }: { playlist: Playlist }) {
	const queryClient = useQueryClient();
	const [text, setText] = useState('');
	const query = useDebounced(text, 300).trim();
	const results = useVideoSearch(query);
	const items = results.data?.pages.flat() ?? [];
	const existing = new Set((playlist.playlistsVideos ?? []).map((pv) => pv.video.id));

	const add = useMutation({
		mutationFn: (videoId: number) =>
			api.post<{ message: string }>('/api/v1/playlist/add-videos', {
				playlistId: playlist.id,
				videoIds: [videoId],
			}),
		onSuccess: () => {
			toast.success('Added to playlist');
			void queryClient.invalidateQueries({ queryKey: ['playlist', playlist.id] });
			void queryClient.invalidateQueries({ queryKey: ['playlists'] });
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<h6 style={{ margin: 0 }}>Add videos</h6>
			<input
				className="input"
				style={{ maxWidth: 380 }}
				aria-label="Search videos to add"
				placeholder="Search videos to add"
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>
			{query !== '' &&
				(items.length > 0 ? (
					<ul
						style={{
							listStyle: 'none',
							margin: 0,
							padding: 0,
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--space-2)',
						}}
					>
						{items.map((video) => (
							<li
								key={video.id}
								className="card"
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 'var(--space-3)',
									padding: 'var(--space-2) var(--space-3)',
								}}
							>
								<div style={{ flex: '1 1 auto', minWidth: 0 }}>
									<div style={{ fontWeight: 500, fontSize: 13 }}>{video.name}</div>
									<div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
										{video.channel?.name}
									</div>
								</div>
								{existing.has(video.id) ? (
									<span className="tag tag-outline">In playlist</span>
								) : (
									<button
										className="btn btn-secondary btn-sm"
										type="button"
										disabled={add.isPending}
										onClick={() => add.mutate(video.id)}
									>
										Add
									</button>
								)}
							</li>
						))}
					</ul>
				) : (
					<p className="field-hint">No videos match “{query}”.</p>
				))}
		</section>
	);
}

function DangerZone({ playlist }: { playlist: Playlist }) {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [confirming, setConfirming] = useState(false);

	const remove = useMutation({
		mutationFn: () => api.del<{ message: string }>(`/api/v1/playlist?id=${playlist.id}`),
		onSuccess: () => {
			toast.success('Playlist deleted');
			void queryClient.invalidateQueries({ queryKey: ['playlists'] });
			navigate('/playlists', { replace: true });
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
			<div
				className="card"
				style={{ boxShadow: 'inset 0 0 0 1px var(--color-accent-800)', gap: 'var(--space-3)' }}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 'var(--space-4)',
						flexWrap: 'wrap',
					}}
				>
					<div style={{ flex: '1 1 260px', minWidth: 0 }}>
						<div style={{ fontWeight: 600, fontSize: 13 }}>Delete this playlist</div>
						<p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
							A soft delete: the videos themselves stay up.
						</p>
					</div>
					<button className="btn btn-danger" type="button" onClick={() => setConfirming(true)}>
						Delete playlist
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
					<div className="dialog" role="dialog" aria-modal="true" aria-labelledby="pd-del-title">
						<div className="dialog-title" id="pd-del-title">
							Delete “{playlist.name}”?
						</div>
						<div className="dialog-body">
							The playlist disappears immediately. The videos in it are not touched.
						</div>
						<div className="dialog-actions">
							<button
								className="btn btn-secondary"
								type="button"
								onClick={() => setConfirming(false)}
							>
								Keep it
							</button>
							<button
								className="btn btn-primary"
								type="button"
								disabled={remove.isPending}
								onClick={() => remove.mutate()}
							>
								Delete playlist
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}

export function PlaylistDetail() {
	const { id: idParam } = useParams();
	const id = Number(idParam);

	const playlistQuery = useQuery({
		queryKey: ['playlist', id],
		enabled: Number.isInteger(id),
		queryFn: () => api.get<Playlist | null>(`/api/v1/playlist/by-id?id=${id}`),
	});

	if (!Number.isInteger(id)) return <p className="page-sub">No such playlist.</p>;
	if (playlistQuery.isError) return <p className="page-sub">Could not load this playlist.</p>;
	if (playlistQuery.isPending) return <p className="page-sub">Loading…</p>;

	const playlist = playlistQuery.data;
	if (!playlist) return <p className="page-sub">No such playlist.</p>;

	const system = isSystem(playlist);
	const videos = (playlist.playlistsVideos ?? []).map((pv) => toCardVideo(pv.video));
	const count = videos.length;

	return (
		<>
			<div className="page-head">
				<div>
					<Link className="btn btn-ghost btn-sm" to="/playlists">
						← Playlists
					</Link>
					<h1 style={{ marginTop: 8 }}>{playlist.name}</h1>
					<p className="page-sub">
						{count} {count === 1 ? 'video' : 'videos'} ·{' '}
						{system ? 'system' : (playlist.privacy ?? 'private')}
					</p>
				</div>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
				{count > 0 ? (
					<VideoGrid videos={videos} />
				) : (
					<div className="empty">
						<h4 style={{ margin: 0 }}>No videos in this playlist yet</h4>
						<p>Search below to add the first one{system ? '' : ', or drop by later'}.</p>
					</div>
				)}

				{system ? (
					<p className="page-sub" style={{ marginTop: 0 }}>
						This is a system playlist — kept automatically, never public, and it can’t be
						renamed, edited or deleted.
					</p>
				) : (
					<div
						style={{
							maxWidth: 640,
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--space-8)',
						}}
					>
						<DetailsCard playlist={playlist} />
						<AddVideos playlist={playlist} />
						<DangerZone playlist={playlist} />
					</div>
				)}
			</div>
		</>
	);
}
