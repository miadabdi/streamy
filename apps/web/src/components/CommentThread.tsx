import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { myChannelId } from '../lib/auth';
import { storageBase } from '../lib/env';
import { channelInitials, timeAgo } from '../lib/format';
import type { ApiFile, ChannelWithAvatar, Me, WatchComment, WatchVideo } from '../types/api';

export function ChannelAvatar({
	channel,
	size = 'sm',
}: {
	/** structural: me.channels carries no avatar relation — initials fallback covers it */
	channel: { name: string | null; avatar?: ApiFile | null } | null;
	size?: '' | 'sm' | 'lg';
}) {
	if (channel?.avatar) {
		const file = channel.avatar;
		return (
			<img
				className={`avatar${size ? ` avatar-${size}` : ''}`}
				src={`${storageBase()}/${file.bucketName}/${file.path}`}
				alt=""
				style={{ objectFit: 'cover' }}
			/>
		);
	}
	return <span className={`avatar${size ? ` avatar-${size}` : ''}`}>{channelInitials(channel?.name)}</span>;
}

function CommentForm({
	label,
	submitLabel,
	initialValue = '',
	onSubmit,
	onCancel,
}: {
	label: string;
	submitLabel: string;
	initialValue?: string;
	/** resolves on success — the form keeps its text when this rejects */
	onSubmit: (content: string) => Promise<unknown>;
	onCancel?: () => void;
}) {
	const [content, setContent] = useState(initialValue);
	const [saving, setSaving] = useState(false);
	// server DTO: content length 3–1024
	const trimmed = content.trim();
	const valid = trimmed.length >= 3 && trimmed.length <= 1024;
	return (
		<form
			onSubmit={async (event) => {
				event.preventDefault();
				if (!valid || saving) return;
				setSaving(true);
				try {
					await onSubmit(trimmed);
					setContent('');
				} catch {
					// never discard what the viewer typed on a failed save
					toast.error('Comment not saved — your text is kept');
				} finally {
					setSaving(false);
				}
			}}
		>
			<input
				className="input"
				aria-label={label}
				placeholder={label}
				maxLength={1024}
				value={content}
				onChange={(event) => setContent(event.target.value)}
			/>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
				{onCancel && (
					<button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
						Cancel
					</button>
				)}
				<button type="submit" className="btn btn-primary btn-sm" disabled={!valid || saving}>
					{submitLabel}
				</button>
			</div>
		</form>
	);
}

function displayName(channel: ChannelWithAvatar | null): string {
	return channel?.name ?? channel?.username ?? 'unknown';
}

/**
 * The watch page's comment section (Nocturne/templates/watch/Watch.dc.html):
 * comments arrive flat in the embedded video (replyTo ids only), so replies
 * are grouped under their ULTIMATE root — one visual nesting level, exactly
 * what the template shows. Mutations invalidate ['video', id] and let the
 * refetch carry the new embedded array back in.
 */
export function CommentThread({ video, me }: { video: WatchVideo; me: Me | null | undefined }) {
	const queryClient = useQueryClient();
	const channelId = me ? myChannelId(me) : undefined;
	const [replyingTo, setReplyingTo] = useState<number | null>(null);
	const [editing, setEditing] = useState<number | null>(null);

	const invalidate = () => queryClient.invalidateQueries({ queryKey: ['video', video.id] });

	const createComment = useMutation({
		mutationFn: (input: { content: string; replyTo?: number }) =>
			api.post('/api/v1/comment', { ...input, videoId: video.id, ownerId: channelId }),
		onSuccess: (_data, variables) => {
			if (variables.replyTo != null) setReplyingTo(null);
			invalidate();
		},
	});
	const updateComment = useMutation({
		mutationFn: (input: { id: number; content: string }) => api.patch('/api/v1/comment', input),
		onSuccess: () => {
			setEditing(null);
			invalidate();
		},
	});
	const deleteComment = useMutation({
		mutationFn: (id: number) => api.del(`/api/v1/comment?id=${id}`),
		onSuccess: invalidate,
	});

	const comments = video.comments;
	const byId = new Map(comments.map((comment) => [comment.id, comment]));
	const rootIdOf = (comment: WatchComment): number => {
		const seen = new Set<number>(); // a replyTo cycle would walk forever
		let current = comment;
		while (current.replyTo != null) {
			if (seen.has(current.id)) break;
			seen.add(current.id);
			const parent = byId.get(current.replyTo);
			if (!parent) break; // orphaned reply → renders as its own root
			current = parent;
		}
		return current.id;
	};
	const roots = comments.filter((comment) => rootIdOf(comment) === comment.id);
	const repliesOf = (rootId: number) => comments.filter((c) => c.replyTo != null && rootIdOf(c) === rootId && c.id !== rootId);

	const renderComment = (comment: WatchComment) => {
		const own = channelId != null && comment.ownerId === channelId;
		const who = displayName(comment.owner);
		return (
			<div className="comment" key={comment.id}>
				<ChannelAvatar channel={comment.owner} />
				<div className="comment-body">
					<div className="comment-head">
						<span className="comment-who">{who}</span>
						<span className="comment-when">{timeAgo(comment.createdAt)}</span>
						{comment.isEdited && <span className="comment-edited">edited</span>}
					</div>
					{editing === comment.id ? (
						<CommentForm
							label="Edit comment"
							submitLabel="Save"
							initialValue={comment.content}
							onSubmit={(content) => updateComment.mutateAsync({ id: comment.id, content })}
							onCancel={() => setEditing(null)}
						/>
					) : (
						<p className="comment-text">{comment.content}</p>
					)}
					{channelId != null && (
						<div className="comment-actions">
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								style={{ paddingInline: 0 }}
								onClick={() => {
									setEditing(null);
									setReplyingTo(replyingTo === comment.id ? null : comment.id);
								}}
							>
								Reply
							</button>
							{own && (
								<button
									type="button"
									className="btn btn-ghost btn-sm"
									style={{ paddingInline: 0 }}
									onClick={() => {
										setReplyingTo(null);
										setEditing(editing === comment.id ? null : comment.id);
									}}
								>
									Edit
								</button>
							)}
							{own && (
								<button
									type="button"
									className="btn btn-ghost btn-sm"
									style={{ paddingInline: 0 }}
									onClick={() => {
										if (window.confirm('Delete this comment?'))
											deleteComment.mutate(comment.id);
									}}
								>
									Delete
								</button>
							)}
						</div>
					)}
					{replyingTo === comment.id && (
						<CommentForm
							label={`Reply to ${who}`}
							submitLabel="Post reply"
							onSubmit={(content) => createComment.mutateAsync({ content, replyTo: comment.id })}
							onCancel={() => setReplyingTo(null)}
						/>
					)}
				</div>
			</div>
		);
	};

	return (
		<section style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 6 }}>
			<h6 style={{ margin: 0 }}>{comments.length} comment{comments.length === 1 ? '' : 's'}</h6>

			{channelId != null ? (
				<div className="comment">
					<ChannelAvatar channel={(me!.channels.find((c) => c.id === channelId) ?? null) as ChannelWithAvatar | null} />
					<div className="comment-body" style={{ flex: '1 1 0' }}>
						<CommentForm
							label="Add a comment"
							submitLabel="Comment"
							onSubmit={(content) => createComment.mutateAsync({ content })}
						/>
					</div>
				</div>
			) : (
				me === null && (
					<Link to="/signin" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
						Sign in to comment
					</Link>
				)
			)}

			{roots.map((root) => (
				<Fragment key={root.id}>
					{renderComment(root)}
					{repliesOf(root.id).length > 0 && (
						<div className="comment-replies">{repliesOf(root.id).map(renderComment)}</div>
					)}
				</Fragment>
			))}
		</section>
	);
}
