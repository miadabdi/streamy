import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Thumb } from '../components/Thumb';
import { Field } from './auth/Field';
import { api } from '../lib/api';
import { myChannelId, useMe } from '../lib/auth';
import { channelInitials } from '../lib/format';
import { zodResolver } from '../lib/zodResolver';
import type { Playlist } from '../types/api';

// Mirrors apps/api/src/playlist/dto/create-playlist.dto.ts — same lengths the
// server enforces (description is required there, not optional) — so the
// client never posts what the server rejects.
const createSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(256, 'Name is too long'),
	description: z
		.string()
		.min(8, 'Description must be at least 8 characters')
		.max(2048, 'Description is too long'),
});
type CreateValues = z.infer<typeof createSchema>;

/** System playlists (likes/dislikes/watched) are kept automatically by type. */
function isSystem(playlist: Playlist): boolean {
	return playlist.type != null && playlist.type !== 'custom';
}

function NewPlaylistDialog({
	channelId,
	onClose,
}: {
	channelId: number;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

	const create = useMutation({
		mutationFn: (values: CreateValues) =>
			api.post<Playlist>('/api/v1/playlist', { ...values, channelId, privacy: 'private' }),
		onSuccess: () => {
			toast.success('Playlist created');
			void queryClient.invalidateQueries({ queryKey: ['playlists'] });
			onClose();
		},
		onError: (error) => toast.error(error.message),
	});

	// Escape closes the dialog like a native one would
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<div
			className="dialog-backdrop"
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="dialog" role="dialog" aria-modal="true" aria-labelledby="pl-new-title">
				<div className="dialog-title" id="pl-new-title">
					New playlist
				</div>
				<form
					onSubmit={handleSubmit((values) => create.mutate(values))}
					style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
				>
					<Field htmlFor="pl-name" label="Name" error={errors.name?.message}>
						<input
							className="input"
							id="pl-name"
							aria-invalid={errors.name ? true : undefined}
							{...register('name')}
						/>
					</Field>
					<Field htmlFor="pl-desc" label="Description" error={errors.description?.message}>
						<textarea
							className="input"
							id="pl-desc"
							rows={4}
							aria-invalid={errors.description ? true : undefined}
							{...register('description')}
						/>
					</Field>
					<p className="field-hint" style={{ margin: 0 }}>
						Starts private — flip it to public from the playlist page.
					</p>
					<div className="dialog-actions">
						<button className="btn btn-secondary" type="button" onClick={onClose}>
							Cancel
						</button>
						<button className="btn btn-primary" type="submit" disabled={create.isPending}>
							Create playlist
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function PlaylistCard({ playlist, channelName }: { playlist: Playlist; channelName: string }) {
	const count = playlist.playlistsVideos?.length ?? 0;
	return (
		<Link className="vcard" to={`/playlists/${playlist.id}`}>
			<div className="vcard-thumb">
				{/* the first video's thumbnail doubles as the cover */}
				<Thumb
					seed={String(playlist.id)}
					initials={channelInitials(channelName)}
					file={playlist.playlistsVideos?.[0]?.video.thumbnailFile ?? null}
				/>
				<span className="vcard-dur">
					{count} {count === 1 ? 'video' : 'videos'}
				</span>
			</div>
			<div className="vcard-row">
				<div className="vcard-body">
					<span className="vcard-title">{playlist.name}</span>
					<div className="vcard-meta">
						<span className="tag tag-outline">{playlist.privacy ?? 'private'}</span>
					</div>
				</div>
			</div>
		</Link>
	);
}

export function Playlists() {
	const me = useMe().data;
	const [pickedChannelId, setPickedChannelId] = useState<number>();
	const [creating, setCreating] = useState(false);

	const channels = me?.channels ?? [];
	const channelId = pickedChannelId ?? (me ? myChannelId(me) : undefined);

	const playlistsQuery = useQuery({
		queryKey: ['playlists', channelId],
		enabled: channelId != null,
		queryFn: () => api.get<Playlist[]>(`/api/v1/playlist/by-channel?channelId=${channelId}`),
	});

	if (!me || channelId == null) return <p className="page-sub">Loading…</p>;
	if (playlistsQuery.isError) return <p className="page-sub">Could not load your playlists.</p>;
	if (playlistsQuery.isPending) return <p className="page-sub">Loading…</p>;

	const channel = channels.find((c) => c.id === channelId) ?? channels[0];
	const playlists = playlistsQuery.data;
	const custom = playlists.filter((p) => !isSystem(p));
	const system = playlists.filter(isSystem);

	return (
		<>
			<div className="page-head">
				<div>
					<h1>Playlists</h1>
					<p className="page-sub">
						{channel?.name} · {custom.length} custom, {system.length} system
					</p>
				</div>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					<button className="btn btn-primary" type="button" onClick={() => setCreating(true)}>
						New playlist
					</button>
				</div>
			</div>

			{channels.length > 1 && (
				<div className="field" style={{ marginBottom: 'var(--space-6)' }}>
					<div className="seg" role="group" aria-label="Channel">
						{channels.map((c) => (
							<label key={c.id} className="seg-opt">
								<input
									type="radio"
									name="pl-channel"
									checked={c.id === channelId}
									onChange={() => setPickedChannelId(c.id)}
								/>
								<span className="avatar avatar-sm">{channelInitials(c.name)}</span>
								{c.username}
							</label>
						))}
					</div>
					<p className="field-hint">Defaults to your current channel.</p>
				</div>
			)}

			<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
				{custom.length > 0 ? (
					<div className="vgrid">
						{custom.map((playlist) => (
							<PlaylistCard key={playlist.id} playlist={playlist} channelName={channel?.name ?? ''} />
						))}
					</div>
				) : (
					<div className="empty">
						<h4 style={{ margin: 0 }}>No playlists yet</h4>
						<p>
							Group videos into a playlist to watch them in order, or keep one private as a shelf
							for later.
						</p>
						<button className="btn btn-primary" type="button" onClick={() => setCreating(true)}>
							Create a playlist
						</button>
					</div>
				)}

				{system.length > 0 && (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
						<h6 style={{ margin: 0 }}>System playlists</h6>
						<p
							style={{
								margin: 0,
								fontSize: 12.5,
								color: 'var(--color-muted)',
								maxWidth: '64ch',
							}}
						>
							Kept automatically and never public. They can’t be renamed or deleted.
						</p>
						<div
							style={{
								borderRadius: 'var(--radius-md)',
								background: 'var(--color-surface)',
								boxShadow: 'var(--shadow-sm)',
								overflow: 'hidden',
							}}
						>
							<table className="table">
								<thead>
									<tr>
										<th>Playlist</th>
										<th>Type</th>
										<th style={{ textAlign: 'right' }}>Videos</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{system.map((playlist) => (
										<tr key={playlist.id}>
											<td style={{ fontWeight: 500 }}>{playlist.name}</td>
											<td
												className="mono"
												style={{ fontSize: 11, color: 'var(--color-muted)' }}
											>
												{playlist.type}
											</td>
											<td className="num">{playlist.playlistsVideos?.length ?? 0}</td>
											<td style={{ textAlign: 'right' }}>
												<Link className="btn btn-ghost btn-sm" to={`/playlists/${playlist.id}`}>
													Open
												</Link>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</section>

			{creating && channelId != null && (
				<NewPlaylistDialog channelId={channelId} onClose={() => setCreating(false)} />
			)}
		</>
	);
}
