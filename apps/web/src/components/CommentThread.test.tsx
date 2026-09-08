import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	makeChannel,
	makeComment,
	makeMe,
	makeWatchVideo,
	type ChannelWithAvatar,
	type WatchComment,
} from '../test/fixtures';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { CommentThread } from './CommentThread';

const kbench: ChannelWithAvatar = {
	...makeChannel({ id: 2, ownerId: 2, username: 'kbench', name: 'kbench' }),
	avatar: null,
};

const posted: Array<Record<string, unknown>> = [];
const patched: Array<Record<string, unknown>> = [];

// Backing store: mutations apply here and GET /video/by-id re-serves it, the
// same refetch loop the real page runs (mutations invalidate ['video', id]).
function seedComments(initial: WatchComment[]) {
	const comments = [...initial];
	let nextId = 100;
	server.use(
		http.get('/api/v1/video/by-id', () => HttpResponse.json(makeWatchVideo({ id: 7, comments }))),
		http.post('/api/v1/comment', async ({ request }) => {
			const body = (await request.json()) as {
				content: string;
				videoId: number;
				ownerId: number;
				replyTo?: number;
			};
			posted.push(body);
			comments.push(
				makeComment({
					id: nextId++,
					content: body.content,
					videoId: body.videoId,
					ownerId: body.ownerId,
					replyTo: body.replyTo ?? null,
					createdAt: new Date(),
				}),
			);
			return new HttpResponse(null, { status: 201 });
		}),
		http.patch('/api/v1/comment', async ({ request }) => {
			const body = (await request.json()) as { id: number; content: string };
			patched.push(body);
			const target = comments.find((c) => c.id === body.id);
			if (target) {
				target.content = body.content;
				target.isEdited = true;
			}
			return HttpResponse.json(target ?? {});
		}),
		http.delete('/api/v1/comment', ({ request }) => {
			const id = Number(new URL(request.url).searchParams.get('id'));
			const index = comments.findIndex((c) => c.id === id);
			if (index >= 0) comments.splice(index, 1);
			return HttpResponse.json({ message: 'Comment Deleted Successfully' });
		}),
	);
	return comments;
}

function mount(initial: WatchComment[]) {
	// the live array stands in for the invalidate-refetch loop: there is no
	// active ['video', id] query in this harness, so handlers mutate the same
	// instance the component renders from
	const comments = seedComments(initial);
	return renderWithApp(
		<CommentThread video={makeWatchVideo({ id: 7, comments })} me={makeMe()} />,
	);
}

function rowOf(text: string): HTMLElement {
	const row = screen.getByText(text).closest('.comment');
	if (!row) throw new Error(`no .comment row around "${text}"`);
	return row as HTMLElement;
}

beforeEach(() => {
	posted.length = 0;
	patched.length = 0;
});

describe('CommentThread', () => {
	it('threads replies under their root comment, one visual nesting level', () => {
		mount([
			makeComment({ id: 50, ownerId: 1, content: 'root of mine' }),
			makeComment({ id: 51, ownerId: 2, owner: kbench, content: 'direct reply', replyTo: 50 }),
			// a reply-to-reply still belongs under the ultimate root, never deeper
			makeComment({ id: 52, ownerId: 2, owner: kbench, content: 'reply to reply', replyTo: 51 }),
			makeComment({ id: 53, ownerId: 2, owner: kbench, content: 'other root' }),
		]);

		expect(screen.getByText('4 comments')).toBeInTheDocument();

		const root = rowOf('root of mine');
		// the replies block is the root's sibling (template: one nesting level)
		const replies = root.nextElementSibling;
		expect(replies).toHaveClass('comment-replies');
		expect([...Array.from(replies!.querySelectorAll('.comment-text'))].map((el) => el.textContent)).toEqual([
			'direct reply',
			'reply to reply',
		]);
		// direct children of the section: composer + roots only, never replies
		const topLevel = Array.from(document.querySelectorAll('section > .comment')).map(
			(el) => el.textContent,
		);
		expect(topLevel.some((t) => t!.includes('direct reply'))).toBe(false);
		expect(topLevel.some((t) => t!.includes('reply to reply'))).toBe(false);
		expect(topLevel.filter((t) => t!.includes('other root'))).toHaveLength(1);
	});

	it('shows the edited chip only on edited comments', () => {
		mount([
			makeComment({ id: 10, content: 'pristine' }),
			makeComment({ id: 11, content: 'touched', isEdited: true }),
		]);

		expect(within(rowOf('touched')).getByText('edited')).toBeInTheDocument();
		expect(rowOf('pristine').querySelector('.comment-edited')).toBeNull();
	});

	it('creates a root comment, replying nests via replyTo', async () => {
		const user = userEvent.setup();
		mount([makeComment({ id: 10, ownerId: 2, owner: kbench, content: 'root' })]);

		await user.type(screen.getByLabelText('Add a comment'), 'first!');
		await user.click(screen.getByRole('button', { name: 'Comment' }));

		await waitFor(() =>
			expect(posted.at(-1)).toMatchObject({ content: 'first!', videoId: 7, ownerId: 1 }),
		);

		await user.click(within(rowOf('root')).getByRole('button', { name: 'Reply' }));
		await user.type(screen.getByLabelText('Reply to kbench'), 'a reply');
		await user.click(screen.getByRole('button', { name: 'Post reply' }));

		await waitFor(() =>
			expect(posted.at(-1)).toMatchObject({ content: 'a reply', replyTo: 10, ownerId: 1 }),
		);
	});

	it('edits own comment inline (own-only controls) and shows edited after refetch', async () => {
		const user = userEvent.setup();
		mount([
			makeComment({ id: 10, ownerId: 1, content: 'original text' }),
			makeComment({ id: 11, ownerId: 2, owner: kbench, content: 'not mine' }),
		]);

		// Edit/Delete exist only on the viewer's own comments
		expect(within(rowOf('original text')).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
		expect(rowOf('not mine').querySelector('.comment-actions')?.textContent).not.toContain('Edit');

		await user.click(within(rowOf('original text')).getByRole('button', { name: 'Edit' }));
		const input = screen.getByLabelText('Edit comment') as HTMLInputElement;
		expect(input.value).toBe('original text');
		await user.clear(input);
		await user.type(input, 'edited text');
		await user.click(screen.getByRole('button', { name: 'Save' }));

		await waitFor(() => expect(patched).toEqual([{ id: 10, content: 'edited text' }]));
		await waitFor(() => expect(rowOf('edited text').textContent).toContain('edited'));
	});

	it('deletes own comment behind a confirm; declining sends nothing', async () => {
		const confirm = vi.spyOn(window, 'confirm');
		const user = userEvent.setup();
		mount([makeComment({ id: 10, ownerId: 1, content: 'doomed' })]);

		confirm.mockReturnValue(false);
		await user.click(within(rowOf('doomed')).getByRole('button', { name: 'Delete' }));
		expect(confirm).toHaveBeenCalledWith('Delete this comment?');
		expect(screen.getByText('doomed')).toBeInTheDocument();

		confirm.mockReturnValue(true);
		await user.click(within(rowOf('doomed')).getByRole('button', { name: 'Delete' }));
		await waitFor(() => expect(screen.queryByText('doomed')).not.toBeInTheDocument());
	});

	it('prompts anonymous visitors to sign in instead of a composer', () => {
		renderWithApp(<CommentThread video={makeWatchVideo({ id: 7, comments: [] })} me={null} />);

		expect(screen.queryByLabelText('Add a comment')).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Sign in to comment' })).toHaveAttribute(
			'href',
			'/signin',
		);
	});
});
