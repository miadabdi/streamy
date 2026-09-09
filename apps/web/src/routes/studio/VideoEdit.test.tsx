import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	makeFile,
	makeMe,
	makeSubtitle,
	makeTag,
	makeWatchVideo,
	type Subtitle,
	type Tag,
	type WatchVideo,
} from '../../test/fixtures';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { VideoEdit } from './VideoEdit';

// Mutable per-test state the handlers read and write, so invalidations
// refetch through /video/by-id and the UI reflects the mutation.
let video: WatchVideo;
let tags: Tag[];

const calls = {
	patchVideo: [] as { id: number; name?: string; description?: string }[],
	addTags: [] as { videoId: number; tagIds: number[] }[],
	removeTag: [] as { videoId: number; tagId: number }[],
	createTag: [] as { title: string }[],
	deleteTag: [] as number[],
	setThumbnail: 0,
	createSubtitle: 0,
	deleteSubtitle: [] as number[],
	deleteVideo: [] as number[],
};

beforeEach(() => {
	tags = [
		makeTag({ id: 1, title: 'ffmpeg' }),
		makeTag({ id: 2, title: 'homelab' }),
		makeTag({ id: 3, title: 'storage' }),
	];
	video = makeWatchVideo({
		id: 1,
		name: 'Rebuilding the rack',
		description: 'Four drives and one afternoon.',
		videosToTags: [{ tag: tags[0] }, { tag: tags[1] }],
		subtitles: [
			makeSubtitle({ id: 11, langRFC5646: 'en', videoId: 1 }),
			makeSubtitle({ id: 12, langRFC5646: 'fa-IR', videoId: 1 }),
		] satisfies Subtitle[],
		thumbnailFile: null,
	});
	calls.patchVideo = [];
	calls.addTags = [];
	calls.removeTag = [];
	calls.createTag = [];
	calls.deleteTag = [];
	calls.setThumbnail = 0;
	calls.createSubtitle = 0;
	calls.deleteSubtitle = [];
	calls.deleteVideo = [];

	server.use(
		http.get('/api/v1/video/by-id', () => HttpResponse.json(video)),
		http.get('/api/v1/tag', () => HttpResponse.json(tags)),
		http.patch('/api/v1/video', async ({ request }) => {
			const body = (await request.json()) as (typeof calls.patchVideo)[number];
			calls.patchVideo.push(body);
			if (body.name != null) video.name = body.name;
			if (body.description != null) video.description = body.description;
			return HttpResponse.json(video);
		}),
		http.post('/api/v1/tag/add-tags-to-video', async ({ request }) => {
			const body = (await request.json()) as { videoId: number; tagIds: number[] };
			calls.addTags.push(body);
			for (const tagId of body.tagIds) {
				const tag = tags.find((t) => t.id === tagId);
				if (tag && !video.videosToTags.some((v) => v.tag?.id === tagId))
					video.videosToTags.push({ tag });
			}
			return HttpResponse.json({ message: 'Tags were added to the video' }, { status: 201 });
		}),
		http.delete('/api/v1/tag/remove-from-video', ({ request }) => {
			const params = new URL(request.url).searchParams;
			const body = {
				videoId: Number(params.get('videoId')),
				tagId: Number(params.get('tagId')),
			};
			calls.removeTag.push(body);
			video.videosToTags = video.videosToTags.filter((v) => v.tag?.id !== body.tagId);
			return HttpResponse.json({ message: 'Tag was removed from the video' });
		}),
		http.post('/api/v1/tag', async ({ request }) => {
			const body = (await request.json()) as { title: string };
			calls.createTag.push(body);
			const tag = makeTag({ id: 13, title: body.title });
			tags.push(tag);
			return HttpResponse.json(tag, { status: 201 });
		}),
		http.delete('/api/v1/tag', ({ request }) => {
			const id = Number(new URL(request.url).searchParams.get('id'));
			calls.deleteTag.push(id);
			tags = tags.filter((t) => t.id !== id);
			return HttpResponse.json({ message: 'Tag Deleted Successfully' });
		}),
		// bodies stay unread: msw cannot re-read undici-serialized FormData under
		// jsdom — the multipart shapes are pinned in forms.test.ts
		http.patch('/api/v1/video/set-thumbnail', () => {
			calls.setThumbnail++;
			video = { ...video, thumbnailFile: makeFile({ id: 901, path: 'new-thumb.webp' }) };
			return HttpResponse.json(video);
		}),
		http.post('/api/v1/subtitle', () => {
			calls.createSubtitle++;
			const created = makeSubtitle({ id: 90, langRFC5646: 'de', videoId: 1 });
			video.subtitles.push(created);
			return HttpResponse.json(created, { status: 201 });
		}),
		http.delete('/api/v1/subtitle', ({ request }) => {
			const id = Number(new URL(request.url).searchParams.get('id'));
			calls.deleteSubtitle.push(id);
			video.subtitles = video.subtitles.filter((s) => s.id !== id);
			return HttpResponse.json({ message: 'Subtitle Deleted Successfully' });
		}),
		http.delete('/api/v1/video', ({ request }) => {
			calls.deleteVideo.push(Number(new URL(request.url).searchParams.get('id')));
			return HttpResponse.json({ message: 'Video Deleted Successfully' });
		}),
	);
});

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/studio/videos/:id/edit" element={<VideoEdit />} />
			<Route path="/studio/videos" element={<p>my videos marker</p>} />
		</Routes>,
		{ route: '/studio/videos/1/edit' },
	);
}

describe('Video edit', () => {
	it('prefills metadata from the video and keeps Save disabled until dirty', async () => {
		mount();

		expect(await screen.findByDisplayValue('Rebuilding the rack')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Four drives and one afternoon.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
	});

	it('saves metadata with PATCH /video and re-disables Save after', async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByDisplayValue('Rebuilding the rack');

		await user.type(screen.getByLabelText('Name'), ' — remastered');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		expect(calls.patchVideo).toEqual([
			{
				id: 1,
				name: 'Rebuilding the rack — remastered',
				description: 'Four drives and one afternoon.',
			},
		]);
		const save = await screen.findByRole('button', { name: 'Save changes' });
		expect(save).toBeDisabled();
		expect(await screen.findByDisplayValue('Rebuilding the rack — remastered')).toBeInTheDocument();
	});

	it('adds a tag from the instance list and removes one from the video', async () => {
		const user = userEvent.setup();
		mount();
		expect(await screen.findByText('ffmpeg')).toBeInTheDocument();
		expect(screen.getByText('homelab')).toBeInTheDocument();

		await user.selectOptions(
			await screen.findByLabelText('Add a tag'),
			await screen.findByRole('option', { name: 'storage' }),
		);
		await user.click(screen.getByRole('button', { name: 'Add tag' }));

		expect(calls.addTags).toEqual([{ videoId: 1, tagIds: [3] }]);
		expect(await screen.findByText('storage')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Remove tag homelab' }));

		expect(calls.removeTag).toEqual([{ videoId: 1, tagId: 2 }]);
		// the chip is gone (the tag legitimately reappears as a picker option)
		expect(screen.queryByRole('button', { name: 'Remove tag homelab' })).toBeNull();
	});

	it('hides tag create/delete from non-admins', async () => {
		mount();
		expect(await screen.findByText('ffmpeg')).toBeInTheDocument();

		expect(screen.queryByLabelText('New tag')).toBeNull();
		expect(screen.queryByText('Tags on this instance')).toBeNull();
	});

	it('lets admins create a tag and delete an instance tag', async () => {
		const user = userEvent.setup();
		const view = mount();
		await screen.findByText('ffmpeg');

		// flip ['me'] to admin after mount — components read useMe reactively
		view.queryClient.setQueryData(['me'], makeMe({ isAdmin: true }));
		expect(await screen.findByLabelText('New tag')).toBeInTheDocument();

		await user.type(screen.getByLabelText('New tag'), 'transcoding');
		await user.click(screen.getByRole('button', { name: 'Create tag' }));

		expect(calls.createTag).toEqual([{ title: 'transcoding' }]);
		// the picker refetches ['tags'] and offers the new tag
		const picker = await screen.findByLabelText('Add a tag');
		await user.selectOptions(picker, within(picker).getByRole('option', { name: 'transcoding' }));
		expect((picker as HTMLSelectElement).value).toBe('13');

		await user.click(screen.getByRole('button', { name: 'Delete tag storage' }));
		expect(calls.deleteTag).toEqual([3]);
	});

	it('uploads a thumbnail through PATCH /video/set-thumbnail and shows it', async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByText('Thumbnail');
		expect(document.querySelector('.vcard-fallback')).not.toBeNull();

		await user.upload(
			screen.getByLabelText('Thumbnail file'),
			new File(['x'], 'thumb.png', { type: 'image/png' }),
		);

		expect(calls.setThumbnail).toBe(1);
		// Thumb's img is alt="" (decorative), so wait on the DOM, not the a11y tree
		await waitFor(() => expect(document.querySelector('.vcard-thumb img')).not.toBeNull());
		expect(document.querySelector('.vcard-fallback')).toBeNull();
	});

	it('lists subtitles with language labels, uploads one, deletes one', async () => {
		const user = userEvent.setup();
		mount();
		expect(await screen.findByText('Subtitles'));

		const enRow = screen.getByText('English').closest('tr') as HTMLElement;
		expect(within(enRow).getByText('en')).toHaveClass('mono');
		const faRow = screen.getByText('Farsi (Iran)').closest('tr') as HTMLElement;
		expect(within(faRow).getByText('fa-IR')).toHaveClass('mono');

		await user.selectOptions(screen.getByLabelText('Subtitle language'), 'de');
		await user.upload(
			screen.getByLabelText('Subtitle file'),
			new File(['WEBVTT'], 'rack.de.vtt', { type: 'text/vtt' }),
		);

		expect(calls.createSubtitle).toBe(1);
		expect(await screen.findByText('German')).toBeInTheDocument();

		await user.click(within(enRow).getByRole('button', { name: 'Delete' }));
		expect(calls.deleteSubtitle).toEqual([11]);
		expect(screen.queryByText('English')).toBeNull();
	});

	it('soft-deletes behind a confirm dialog and returns to My videos', async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByText('Danger zone');

		await user.click(screen.getByRole('button', { name: 'Delete video' }));
		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText(/Rebuilding the rack/)).toBeInTheDocument();

		// Keep it: dismissed, nothing sent
		await user.click(within(dialog).getByRole('button', { name: 'Keep it' }));
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(calls.deleteVideo).toEqual([]);

		await user.click(screen.getByRole('button', { name: 'Delete video' }));
		await user.click(
			within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete video' }),
		);

		expect(calls.deleteVideo).toEqual([1]);
		expect(await screen.findByText('my videos marker')).toBeInTheDocument();
	});
});
