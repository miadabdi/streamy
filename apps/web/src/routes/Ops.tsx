import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StatTile } from '../components/StatTile';
import { ElapsedIcon, EncoderIcon, FailedIcon } from '../components/icons';
import { useOpsHealth } from '../hooks/useOpsHealth';
import { api } from '../lib/api';
import { formatElapsed } from '../lib/format';
import type { Readiness, Tag } from '../types/api';
import { TagChip } from './studio/TagManager';

// encoder-plan names from apps/worker (encoder-plan.ts): everything but
// libx264 is a working hardware path
const HW_ENCODERS = new Set(['h264_vaapi', 'h264_nvenc', 'h264_qsv']);

export function Ops() {
	const health = useOpsHealth();
	const queryClient = useQueryClient();
	const [newTag, setNewTag] = useState('');
	const [promoteEmail, setPromoteEmail] = useState('');

	const tagsQuery = useQuery({
		queryKey: ['tags'],
		queryFn: () => api.get<Tag[]>('/api/v1/tag'),
	});

	const invalidateTags = () => queryClient.invalidateQueries({ queryKey: ['tags'] });

	const createTag = useMutation({
		mutationFn: (title: string) => api.post<Tag>('/api/v1/tag', { title }),
		onSuccess: () => {
			toast.success('Tag created');
			setNewTag('');
			void invalidateTags();
		},
		onError: (error) => toast.error(error.message),
	});
	const deleteTag = useMutation({
		mutationFn: (id: number) => api.del<{ message: string }>(`/api/v1/tag?id=${id}`),
		onSuccess: () => {
			toast.success('Tag deleted');
			void invalidateTags();
		},
		onError: (error) => toast.error(error.message),
	});
	const promote = useMutation({
		mutationFn: (email: string) => api.patch<{ message: string }>('/api/v1/user/promote', { email }),
		onSuccess: ({ message }) => {
			toast.success(message);
			setPromoteEmail('');
		},
		onError: (error) => toast.error(error.message),
	});

	if (health.isPending) {
		return (
			<div style={{ display: 'grid', placeItems: 'center', minHeight: '50vh' }} aria-busy="true">
				<span className="pill pill-processing">Loading…</span>
			</div>
		);
	}

	if (health.isError) {
		return (
			<div className="empty">
				<FailedIcon className="empty-mark" width={30} height={30} aria-hidden />
				<h4>Worker unreachable</h4>
				<p>
					The worker did not answer its readiness check — it may be down or restarting.
					This page recovers on its own once it responds.
				</p>
				<button
					className="btn btn-secondary btn-sm"
					type="button"
					onClick={() => void health.refetch()}
				>
					Retry
				</button>
			</div>
		);
	}

	const readiness: Readiness = health.data;
	const hardware = HW_ENCODERS.has(readiness.encoder);
	const dlqBad = readiness.deadLetters > 0;

	return (
		<>
			<div className="page-head">
				<div>
					<h1>Instance health</h1>
					<p className="page-sub">Worker readiness · polled every 30 s</p>
				</div>
				<button
					className="btn btn-secondary btn-sm"
					type="button"
					onClick={() => void health.refetch()}
				>
					Refresh
				</button>
			</div>
			<section
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(196px, 1fr))',
					gap: 'var(--space-3)',
				}}
			>
				<StatTile
					label="Message queue"
					value={readiness.rmq ? 'Up' : 'Down'}
					status={readiness.rmq ? 'ok' : 'bad'}
					note={`rabbitmq · consumer ${readiness.rmq ? 'connected' : 'disconnected'}`}
				/>
				<StatTile
					label="Storage"
					value={readiness.storage ? 'Up' : 'Down'}
					status={readiness.storage ? 'ok' : 'bad'}
					note={`minio · bucket ${readiness.storage ? 'reachable' : 'unreachable'}`}
				/>
				<StatTile
					label="Dead letters"
					value={readiness.deadLetters}
					status={dlqBad ? 'bad' : 'ok'}
					note={dlqBad ? 'stuck messages — inspect the worker DLQ' : 'nothing stuck'}
				/>
				<StatTile
					label="Encoder"
					value={readiness.encoder.replace('h264_', '')}
					small
					flag={hardware ? 'hw' : 'sw'}
					icon={<EncoderIcon width={14} height={14} aria-hidden />}
					note={hardware ? 'hardware encode path active' : 'CPU libx264 — slower than hardware'}
				/>
				<StatTile
					label="Active job"
					value={readiness.activeJob ? `#${readiness.activeJob.videoId}` : 'No active job'}
					small
					mono
					icon={<ElapsedIcon width={14} height={14} aria-hidden />}
					note={
						readiness.activeJob
							? `${formatElapsed(readiness.activeJob.startedAt)} elapsed`
							: 'worker idle, waiting on the queue'
					}
				/>
			</section>
			<section
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
					gap: 'var(--space-6)',
					alignItems: 'start',
				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
					<h6 style={{ margin: 0 }}>Tags</h6>
					<p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)' }}>
						Shared across every channel. Deleting one removes it from the videos that carry it.
					</p>
					<div style={{ display: 'flex', gap: 8 }}>
						<input
							className="input"
							placeholder="New tag title"
							aria-label="New tag title"
							value={newTag}
							onChange={(e) => setNewTag(e.target.value)}
						/>
						<button
							className="btn btn-secondary"
							type="button"
							disabled={newTag.trim().length < 3 || createTag.isPending}
							onClick={() => createTag.mutate(newTag.trim())}
						>
							Create
						</button>
					</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
						{(tagsQuery.data ?? []).map((tag) => (
							<TagChip
								key={tag.id}
								title={tag.title}
								confirmLabel={`Delete tag ${tag.title}`}
								onRemove={() => {
									if (window.confirm(`Delete tag ${tag.title}?`)) deleteTag.mutate(tag.id);
								}}
							/>
						))}
						{tagsQuery.isSuccess && tagsQuery.data.length === 0 && (
							<p className="field-hint">No tags yet.</p>
						)}
					</div>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
					<h6 style={{ margin: 0 }}>Admins</h6>
					<p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-muted)' }}>
						Admins reach this console and can promote others. There is no way to demote from the
						UI yet — be deliberate.
					</p>
					{/* No endpoint lists admins yet — the table stays honestly absent
					    instead of shipping fake rows. */}
					<div className="field">
						<label htmlFor="o-email">Promote by email</label>
						<div style={{ display: 'flex', gap: 8 }}>
							<input
								className="input"
								id="o-email"
								placeholder="person@home.lan"
								value={promoteEmail}
								onChange={(e) => setPromoteEmail(e.target.value)}
							/>
							<button
								className="btn btn-secondary"
								type="button"
								disabled={promoteEmail.trim() === '' || promote.isPending}
								onClick={() => promote.mutate(promoteEmail.trim())}
							>
								Promote
							</button>
						</div>
						<p className="field-hint">The account must already exist on this instance.</p>
					</div>
				</div>
			</section>
		</>
	);
}
