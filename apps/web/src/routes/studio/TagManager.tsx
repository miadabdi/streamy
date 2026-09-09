import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useMe } from '../../lib/auth';
import type { Tag, WatchVideo } from '../../types/api';

/** Chip with the template's `.tag-remove` affordance; Enter/Space activate it like a button. */
export function TagChip({
	title,
	confirmLabel,
	onRemove,
}: {
	title: string;
	confirmLabel: string;
	onRemove: () => void;
}) {
	return (
		<span className="tag">
			{title}
			<span
				className="tag-remove"
				role="button"
				tabIndex={0}
				aria-label={confirmLabel}
				onClick={onRemove}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onRemove();
					}
				}}
			>
				×
			</span>
		</span>
	);
}

export function TagManager({ video }: { video: WatchVideo }) {
	const isAdmin = useMe().data?.isAdmin === true;
	const queryClient = useQueryClient();
	const [pick, setPick] = useState('');
	const [newTitle, setNewTitle] = useState('');

	const tagsQuery = useQuery({
		queryKey: ['tags'],
		queryFn: () => api.get<Tag[]>('/api/v1/tag'),
	});

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['video', video.id] });
		void queryClient.invalidateQueries({ queryKey: ['tags'] });
	};

	const add = useMutation({
		mutationFn: (tagId: number) =>
			api.post<{ message: string }>('/api/v1/tag/add-tags-to-video', {
				videoId: video.id,
				tagIds: [tagId],
			}),
		onSuccess: () => {
			// the added tag left `available`; without this the select would keep
			// targeting the now-stale id
			setPick('');
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});
	const remove = useMutation({
		mutationFn: (tagId: number) =>
			api.del<{ message: string }>(`/api/v1/tag/remove-from-video?videoId=${video.id}&tagId=${tagId}`),
		onSuccess: invalidate,
		onError: (error) => toast.error(error.message),
	});
	const create = useMutation({
		mutationFn: (title: string) => api.post<Tag>('/api/v1/tag', { title }),
		onSuccess: () => {
			toast.success('Tag created');
			setNewTitle('');
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});
	const removeGlobal = useMutation({
		mutationFn: (id: number) => api.del<{ message: string }>(`/api/v1/tag?id=${id}`),
		onSuccess: () => {
			toast.success('Tag deleted');
			invalidate();
		},
		onError: (error) => toast.error(error.message),
	});

	const current = video.videosToTags
		.map((entry) => entry.tag)
		.filter((tag): tag is Tag => tag != null);
	const available = (tagsQuery.data ?? []).filter((tag) => !current.some((c) => c.id === tag.id));
	const selectedId = pick || String(available[0]?.id ?? '');

	return (
		<div className="field">
			<label htmlFor="ve-tag-add">Tags</label>
			{current.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
					{current.map((tag) => (
						<TagChip
							key={tag.id}
							title={tag.title}
							confirmLabel={`Remove tag ${tag.title}`}
							onRemove={() => remove.mutate(tag.id)}
						/>
					))}
				</div>
			)}
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<select
					id="ve-tag-add"
					aria-label="Add a tag"
					className="input"
					style={{ maxWidth: 220 }}
					value={selectedId}
					onChange={(e) => setPick(e.target.value)}
					disabled={available.length === 0}
				>
					{available.map((tag) => (
						<option key={tag.id} value={tag.id}>
							{tag.title}
						</option>
					))}
				</select>
				<button
					className="btn btn-secondary btn-sm"
					type="button"
					disabled={available.length === 0 || add.isPending}
					onClick={() => add.mutate(Number(selectedId))}
				>
					Add tag
				</button>
			</div>
			<p className="field-hint">Tags are shared across the instance — pick an existing one.</p>

			{isAdmin && (
				<>
					<label style={{ display: 'block', marginTop: 12 }}>Tags on this instance</label>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
						<input
							className="input"
							aria-label="New tag"
							placeholder="New tag (3–256 chars)"
							style={{ maxWidth: 220 }}
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
						/>
						<button
							className="btn btn-secondary btn-sm"
							type="button"
							disabled={newTitle.trim().length < 3 || create.isPending}
							onClick={() => create.mutate(newTitle.trim())}
						>
							Create tag
						</button>
					</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
						{(tagsQuery.data ?? []).map((tag) => (
							<TagChip
								key={tag.id}
								title={tag.title}
								confirmLabel={`Delete tag ${tag.title}`}
								onRemove={() => removeGlobal.mutate(tag.id)}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
