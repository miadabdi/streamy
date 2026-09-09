import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ChannelAvatar } from '../components/CommentThread';
import { api } from '../lib/api';
import { useMe, useSignOut } from '../lib/auth';
import { channelInitials } from '../lib/format';
import { channelUpdateForm } from '../lib/forms';
import { zodResolver } from '../lib/zodResolver';
import type { Channel, ChannelWithAvatar, Me } from '../types/api';
import { channelSchema } from './auth/schemas';
import { Field } from './auth/Field';
import { z } from 'zod';

// Mirrors apps/api/src/user/dto/update-user.dto.ts — Length(3, 50) per field.
// There is no email- or password-change endpoint, so none is offered here.
const profileSchema = z.object({
	firstName: z
		.string()
		.min(3, 'First name must be at least 3 characters')
		.max(50, 'First name is too long'),
	lastName: z
		.string()
		.min(3, 'Last name must be at least 3 characters')
		.max(50, 'Last name is too long'),
});
type ProfileValues = z.infer<typeof profileSchema>;

// Username never changes after creation here — PATCH /channel is used for
// name/description/avatar only (UpdateChannelDto allows username, the UI does not).
const editSchema = channelSchema.pick({ name: true, description: true });
type EditValues = z.infer<typeof editSchema>;
type CreateValues = z.infer<typeof channelSchema>;

function ProfileSection({ me }: { me: Me }) {
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty, dirtyFields },
	} = useForm<ProfileValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: { firstName: me.firstName ?? '', lastName: me.lastName ?? '' },
	});

	const save = useMutation({
		// dirty-save: only the fields the user actually changed (UpdateUserDto
		// fields are optional, so an untouched one stays untouched server-side)
		mutationFn: (values: ProfileValues) =>
			api.patch<Me>(
				'/api/v1/user/update-me',
				Object.fromEntries(Object.entries(values).filter(([key]) => dirtyFields[key as keyof ProfileValues])),
			),
		onSuccess: (updated) => {
			toast.success('Profile saved');
			reset({ firstName: updated.firstName ?? '', lastName: updated.lastName ?? '' });
			void queryClient.invalidateQueries({ queryKey: ['me'] });
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 18 }}>Profile</h2>
				<p className="page-sub">Your account — separate from the channels you publish as.</p>
			</div>
			<form
				onSubmit={handleSubmit((values) => save.mutate(values))}
				style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
			>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
					<Field htmlFor="s-first" label="First name" error={errors.firstName?.message}>
						<input
							className="input"
							id="s-first"
							aria-invalid={errors.firstName ? true : undefined}
							{...register('firstName')}
						/>
					</Field>
					<Field htmlFor="s-last" label="Last name" error={errors.lastName?.message}>
						<input
							className="input"
							id="s-last"
							aria-invalid={errors.lastName ? true : undefined}
							{...register('lastName')}
						/>
					</Field>
				</div>
				<Field
					htmlFor="s-email"
					label="Email"
					hint={<p className="field-hint">Sign-in address. Changing it needs a new confirmation email.</p>}
				>
					<input className="input" id="s-email" value={me.email} disabled />
				</Field>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<button className="btn btn-ghost" type="button" onClick={() => reset()} disabled={!isDirty}>
						Discard
					</button>
					<button className="btn btn-primary" type="submit" disabled={!isDirty || save.isPending}>
						Save profile
					</button>
				</div>
			</form>
		</section>
	);
}

/** Edit form for one owned channel: name/description + avatar replacement. */
function EditChannelForm({ channel, onDone }: { channel: Channel; onDone: () => void }) {
	const queryClient = useQueryClient();
	const [avatar, setAvatar] = useState<File>();
	const [preview, setPreview] = useState<string>();

	// me.channels carries only avatarFileId — by-id answers the avatar relation.
	const stored = useQuery({
		queryKey: ['channel-edit', channel.id],
		queryFn: () => api.get<ChannelWithAvatar>(`/api/v1/channel/by-id?id=${channel.id}`),
	});

	const {
		register,
		handleSubmit,
		formState: { errors, isDirty },
	} = useForm<EditValues>({
		resolver: zodResolver(editSchema),
		defaultValues: { name: channel.name, description: channel.description },
	});

	const save = useMutation({
		mutationFn: (values: EditValues) =>
			api.patch<Channel>('/api/v1/channel', channelUpdateForm(channel.id, values, avatar)),
		onSuccess: () => {
			toast.success('Channel saved');
			void queryClient.invalidateQueries({ queryKey: ['me'] });
			void queryClient.invalidateQueries({ queryKey: ['channel-edit', channel.id] });
			onDone();
		},
		onError: (error) => toast.error(error.message),
	});

	const pick = (file: File | undefined) => {
		if (preview) URL.revokeObjectURL(preview);
		setPreview(file ? URL.createObjectURL(file) : undefined);
		setAvatar(file);
	};

	return (
		<form
			aria-label="Edit channel"
			className="card"
			style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
			onSubmit={handleSubmit((values) => save.mutate(values))}
		>
			<h3 style={{ margin: 0, fontSize: 15 }}>Edit {channel.name}</h3>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
				{preview ? (
					<img className="avatar" src={preview} alt="" style={{ objectFit: 'cover' }} />
				) : (
					<ChannelAvatar channel={stored.data ?? null} />
				)}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<input
						type="file"
						className="input"
						accept="image/*"
						aria-label="Channel avatar file"
						style={{ maxWidth: 260 }}
						onChange={(e) => {
							pick(e.target.files?.[0]);
							e.target.value = '';
						}}
					/>
					<p className="field-hint" style={{ margin: 0 }}>
						Any image is re-encoded and stored at 400×400.
					</p>
				</div>
			</div>
			<Field htmlFor="ce-name" label="Display name" error={errors.name?.message}>
				<input
					className="input"
					id="ce-name"
					aria-invalid={errors.name ? true : undefined}
					{...register('name')}
				/>
			</Field>
			<Field htmlFor="ce-desc" label="Description" error={errors.description?.message}>
				<textarea className="input" id="ce-desc" rows={4} {...register('description')} />
			</Field>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
				<button className="btn btn-ghost" type="button" onClick={onDone}>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					type="submit"
					disabled={(!isDirty && !avatar) || save.isPending}
				>
					Save channel
				</button>
			</div>
		</form>
	);
}

function ChannelsSection({ me }: { me: Me }) {
	const queryClient = useQueryClient();
	const [editingId, setEditingId] = useState<number>();

	const switchChannel = useMutation({
		mutationFn: (currentChannelId: number) =>
			api.patch<Me>('/api/v1/user/set-current-channel', { currentChannelId }),
		onSuccess: () => {
			toast.success('Switched current channel');
			// studio/upload/playlists operate on the current channel: their caches
			// still answer for the old one until ['me'] refetches and they re-key.
			void queryClient.invalidateQueries({ queryKey: ['me'] });
			void queryClient.invalidateQueries({ queryKey: ['studio-videos'] });
			void queryClient.invalidateQueries({ queryKey: ['playlists'] });
		},
		onError: (error) => toast.error(error.message),
	});

	const channels = me.channels;
	const current = channels.find((c) => c.id === me.currentChannelId) ?? channels[0];
	const editing = channels.find((c) => c.id === editingId);

	return (
		<section
			id="channels"
			style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', scrollMarginTop: 16 }}
		>
			<div>
				<h2 style={{ margin: 0, fontSize: 18 }}>Channels</h2>
				<p className="page-sub">You publish, comment and subscribe as the current channel.</p>
			</div>
			{/* the switcher the sidenav's "Switch channel" links to (#channels) */}
			<div className="app-channel" style={{ margin: 0 }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
					<span className="avatar avatar-sm">{channelInitials(current?.name)}</span>
					<div style={{ minWidth: 0 }}>
						<div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{current?.name}</div>
						<div
							className="mono"
							style={{ fontSize: 10, color: 'var(--color-muted)', whiteSpace: 'nowrap' }}
						>
							current channel
						</div>
					</div>
				</div>
			</div>
			{channels.map((channel) => {
				const isCurrent = channel.id === current?.id;
				return (
					<div
						key={channel.id}
						className="card"
						style={{ boxShadow: 'inset 0 0 0 1px var(--color-divider-strong)' }}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
							<ChannelAvatar channel={channel as ChannelWithAvatar} />
							<div style={{ flex: '1 1 200px', minWidth: 0 }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span style={{ fontWeight: 600, fontSize: 14 }}>{channel.name}</span>
									{isCurrent && <span className="tag tag-accent">current</span>}
								</div>
								<div className="mono" style={{ fontSize: 11, color: 'var(--color-muted)' }}>
									@{channel.username} · {channel.numberOfSubscribers ?? 0} subscribers
								</div>
							</div>
							<div style={{ display: 'flex', gap: 6 }}>
								{!isCurrent && (
									<button
										className="btn btn-primary btn-sm"
										type="button"
										disabled={switchChannel.isPending}
										onClick={() => switchChannel.mutate(channel.id)}
									>
										Make current
									</button>
								)}
								<button
									className="btn btn-secondary btn-sm"
									type="button"
									onClick={() => setEditingId(channel.id === editingId ? undefined : channel.id)}
								>
									Edit
								</button>
							</div>
						</div>
					</div>
				);
			})}
			{editing && <EditChannelForm channel={editing} onDone={() => setEditingId(undefined)} />}
		</section>
	);
}

function NewChannelForm() {
	const queryClient = useQueryClient();
	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<CreateValues>({ resolver: zodResolver(channelSchema) });

	const create = useMutation({
		mutationFn: (values: CreateValues) => api.post<Channel>('/api/v1/channel', values),
		onSuccess: () => {
			toast.success('Channel created');
			reset();
			void queryClient.invalidateQueries({ queryKey: ['me'] });
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
			<div>
				<h2 style={{ margin: 0, fontSize: 18 }}>New channel</h2>
				<p className="page-sub">Signup created your first one; the rest are up to you.</p>
			</div>
			<form
				aria-label="New channel"
				onSubmit={handleSubmit((values) => create.mutate(values))}
				style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
			>
				<Field
					htmlFor="nc-username"
					label="Channel username"
					error={errors.username?.message}
					hint={
						<p className="field-hint mono">
							8–128 characters · a–z, 0–9, dot, underscore · no _ or . at the start or end
						</p>
					}
				>
					<input
						className="input"
						id="nc-username"
						placeholder="longwave"
						aria-invalid={errors.username ? true : undefined}
						{...register('username')}
					/>
				</Field>
				<Field htmlFor="nc-name" label="Display name" error={errors.name?.message}>
					<input
						className="input"
						id="nc-name"
						placeholder="Longwave"
						aria-invalid={errors.name ? true : undefined}
						{...register('name')}
					/>
				</Field>
				<Field htmlFor="nc-desc" label="Description" error={errors.description?.message}>
					<textarea
						className="input"
						id="nc-desc"
						placeholder="What this channel is for."
						aria-invalid={errors.description ? true : undefined}
						{...register('description')}
					/>
				</Field>
				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
					<button
						className="btn btn-ghost"
						type="button"
						onClick={() => reset()}
						disabled={!isDirty || create.isPending}
					>
						Clear
					</button>
					<button className="btn btn-primary" type="submit" disabled={create.isPending}>
						Create channel
					</button>
				</div>
			</form>
		</section>
	);
}

function SessionSection() {
	const signOut = useSignOut();

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<h6 style={{ margin: 0 }}>Session</h6>
			<div className="card">
				<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
					<div style={{ flex: '1 1 260px', minWidth: 0 }}>
						<div style={{ fontWeight: 600, fontSize: 13 }}>Sign out of this instance</div>
						<p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--color-muted)' }}>
							You keep your channels; only this browser session ends.
						</p>
					</div>
					<button
						className="btn btn-secondary"
						type="button"
						disabled={signOut.isPending}
						onClick={() => signOut.mutate()}
					>
						Sign out
					</button>
				</div>
			</div>
		</section>
	);
}

export function Settings() {
	const me = useMe().data;
	if (!me) return <p className="page-sub">Loading…</p>;

	return (
		<div
			className="app-page-narrow"
			style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}
		>
			<div className="page-head">
				<div>
					<h1>Settings</h1>
					<p className="page-sub">{me.email}</p>
				</div>
			</div>
			<ProfileSection me={me} />
			<ChannelsSection me={me} />
			<NewChannelForm />
			<SessionSection />
		</div>
	);
}
