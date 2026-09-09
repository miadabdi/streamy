import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeChannel, makeFile, makeMe, makeVideo, type Me } from '../../test/fixtures';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { Upload } from './Upload';

// The presigned URL points at object storage, not the API: an absolute host
// that only exists in the test. The PUT handler must match it (plan risk #5).
const STORAGE = 'http://storage.test';
const FILE = new File([new Uint8Array(2_000)], 'overnight-queue-03.mp4', { type: 'video/mp4' });

type CreateBody = {
	name: string;
	description: string;
	channelId: number;
	type: string;
	tagIds: number[];
};

const createdBodies: CreateBody[] = [];
const presignQueries: Array<{ id: number; path: string }> = [];
const confirmCalls: string[] = [];
const queueCalls: string[] = [];

beforeEach(() => {
	createdBodies.length = 0;
	presignQueries.length = 0;
	confirmCalls.length = 0;
	queueCalls.length = 0;
});

type Gates = {
	put: (status?: number) => Promise<void>;
	confirm: (status?: number) => Promise<void>;
	queue: (status?: number) => Promise<void>;
};

function deferred<T>() {
	let release!: (value: T) => void;
	const promise = new Promise<T>((resolve) => {
		release = resolve;
	});
	return { promise, release };
}

/**
 * The full pipeline. `paused` gates PUT/confirm/queue behind manual releases so
 * a test can assert each machine state as the walk progresses; immediate mode
 * answers everything on arrival. `failures` makes the FIRST call to that
 * endpoint answer with the given status (one-shot), then the healthy path.
 */
function installPipeline(
	paused = false,
	failures: { confirm?: number; queue?: number } = {},
): Gates {
	const gates = {
		put: deferred<Response>(),
		confirm: deferred<Response>(),
		queue: deferred<Response>(),
	};
	let confirmFailedOnce = false;
	let queueFailedOnce = false;
	server.use(
		http.post('/api/v1/video', async ({ request }) => {
			createdBodies.push((await request.json()) as CreateBody);
			return HttpResponse.json(
				makeVideo({ id: 11, name: 'Overnight queue, third attempt', processingStatus: 'ready_for_upload' }),
				{ status: 201 },
			);
		}),
		http.get('/api/v1/video/get-presigned-put-url', ({ request }) => {
			const params = new URL(request.url).searchParams;
			presignQueries.push({ id: Number(params.get('id')), path: params.get('path') ?? '' });
			return HttpResponse.json({
				url: `${STORAGE}/videos/${params.get('id')}/${params.get('path')}?X-Amz-Signature=sig`,
				fileRecord: makeFile(),
			});
		}),
		// The PUT goes to an ABSOLUTE cross-origin URL and bypasses api.ts. msw's
		// XHR interceptor only matches such URLs via a regex predicate (string
		// absolute paths coerce against the page origin) — plan risk #5. The CORS
		// header mirrors the bucket rule real storage needs for browser PUTs.
		http.put(/storage\.test\/videos\//, () =>
			paused
				? gates.put.promise
				: Promise.resolve(
						new HttpResponse(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } }),
					),
		),
		http.post('/api/v1/video/confirm-upload', () => {
			confirmCalls.push('call');
			const status = !confirmFailedOnce && failures.confirm ? ((confirmFailedOnce = true), failures.confirm) : 200;
			const response = HttpResponse.json({ message: 'confirmed' }, { status });
			return paused ? gates.confirm.promise.then(() => response) : Promise.resolve(response);
		}),
		http.post('/api/v1/video/send-video-to-process-queue', () => {
			queueCalls.push('call');
			const status = !queueFailedOnce && failures.queue ? ((queueFailedOnce = true), failures.queue) : 201;
			const response = HttpResponse.json({ message: 'queued' }, { status });
			return paused ? gates.queue.promise.then(() => response) : Promise.resolve(response);
		}),
	);
	return {
		put: (status = 200) =>
			act(async () => {
				gates.put.release(
					new HttpResponse(null, { status, headers: { 'Access-Control-Allow-Origin': '*' } }),
				);
			}),
		confirm: (status = 200) =>
			act(async () => {
				gates.confirm.release(HttpResponse.json({ message: 'confirmed' }, { status }));
			}),
		queue: (status = 201) =>
			act(async () => {
				gates.queue.release(HttpResponse.json({ message: 'queued' }, { status }));
			}),
	};
}

function mount(route = '/studio/upload') {
	return renderWithApp(
		<Routes>
			<Route path="/studio/upload" element={<Upload />} />
			<Route path="/studio/videos" element={<p>studio videos marker</p>} />
		</Routes>,
		{ route },
	);
}

function step(name: string): HTMLElement {
	return screen.getByText(name).closest('li') as HTMLElement;
}

/** The `NN% · sent of total` mono meter inside the progress card. */
function meter(): string {
	return (document.querySelector('.card span.mono') as HTMLElement | null)?.textContent ?? '';
}

function barWidth(): string {
	return (document.querySelector('.progress > i') as HTMLElement | null)?.style.width ?? '';
}

async function fillMetadata(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('Name'), 'Overnight queue, third attempt');
	await user.type(
		screen.getByLabelText('Description'),
		'Eleven files, one encoder, and the flag that finally stuck.',
	);
	await user.click(screen.getByRole('button', { name: 'Continue to file' }));
}

async function pickFile(user: ReturnType<typeof userEvent.setup>, file = FILE) {
	await user.upload(screen.getByLabelText('Choose a video file'), file);
}

describe('Upload wizard', () => {
	it('walks idle → creating → uploading → confirming → queueing → done and lands on My videos', async () => {
		const user = userEvent.setup();
		const gates = installPipeline(true);
		mount();

		// step 1: metadata before the file exists
		expect(step('Metadata')).toHaveAttribute('aria-current', 'step');
		// single channel → no picker
		expect(screen.queryByRole('radio')).toBeNull();

		await fillMetadata(user);
		expect(step('Metadata')).toHaveAttribute('data-done', 'true');
		expect(step('File')).toHaveAttribute('aria-current', 'step');
		expect(screen.getByText(/valid for one hour/)).toBeInTheDocument();

		await pickFile(user);

		// creating + presign happened; the PUT is held at the gate
		await screen.findByText('overnight-queue-03.mp4');
		expect(meter()).toBe('0% · 0 B of 2 kB');
		expect(barWidth()).toBe('0%');
		expect(createdBodies).toEqual([
			{
				name: 'Overnight queue, third attempt',
				description: 'Eleven files, one encoder, and the flag that finally stuck.',
				channelId: 1,
				type: 'vod',
				tagIds: [],
			},
		]);
		expect(presignQueries).toEqual([{ id: 11, path: 'overnight-queue-03.mp4' }]);

		await gates.put();
		expect(await screen.findByText('confirming the upload…')).toBeInTheDocument();
		expect(meter()).toBe('100% · 2 kB of 2 kB');
		expect(barWidth()).toBe('100%');
		expect(step('File')).toHaveAttribute('data-done', 'true');
		expect(step('Confirm')).toHaveAttribute('aria-current', 'step');

		await gates.confirm();
		expect(await screen.findByText('sending to the processing queue…')).toBeInTheDocument();
		expect(step('Queue')).toHaveAttribute('aria-current', 'step');

		await gates.queue();
		expect(await screen.findByText('studio videos marker')).toBeInTheDocument();
	});

	it('shows the designed 404 error at confirm, then resumes at confirm on retry', async () => {
		const user = userEvent.setup();
		installPipeline(false, { confirm: 404 });
		mount();

		await fillMetadata(user);
		await pickFile(user);

		expect(await screen.findByText('Upload not found (404)')).toBeInTheDocument();
		expect(screen.getByText(/isn’t in storage yet/)).toBeInTheDocument();
		expect(screen.getByText(/Ready for upload/)).toBeInTheDocument();
		expect(step('Confirm')).toHaveAttribute('aria-current', 'step');
		expect(confirmCalls).toHaveLength(1);

		await user.click(screen.getByRole('button', { name: 'Retry confirm' }));

		expect(await screen.findByText('studio videos marker')).toBeInTheDocument();
		// resumed at confirm: no second create, no second PUT
		expect(createdBodies).toHaveLength(1);
		expect(presignQueries).toHaveLength(1);
		expect(confirmCalls).toHaveLength(2);
		expect(queueCalls).toHaveLength(1);
	});

	it('shows the designed 400 error at queue, then resumes at queue on retry', async () => {
		const user = userEvent.setup();
		installPipeline(false, { queue: 400 });
		mount();

		await fillMetadata(user);
		await pickFile(user);

		expect(await screen.findByText('Can’t queue this video (400)')).toBeInTheDocument();
		expect(screen.getByText(/hasn’t been confirmed/)).toBeInTheDocument();
		expect(step('Queue')).toHaveAttribute('aria-current', 'step');

		await user.click(screen.getByRole('button', { name: 'Retry queue' }));

		expect(await screen.findByText('studio videos marker')).toBeInTheDocument();
		expect(confirmCalls).toHaveLength(1);
		expect(queueCalls).toHaveLength(2);
	});

	it('resumes a ready_for_upload video from ?videoId= without creating a new row', async () => {
		const user = userEvent.setup();
		installPipeline();
		mount('/studio/upload?videoId=6');

		expect(await screen.findByText(/Drop your video here/)).toBeInTheDocument();
		expect(screen.queryByLabelText('Name')).toBeNull();
		expect(screen.getByText(/Continuing an unfinished upload/)).toBeInTheDocument();
		expect(step('Metadata')).toHaveAttribute('data-done', 'true');
		expect(step('File')).toHaveAttribute('aria-current', 'step');

		await pickFile(user);

		expect(await screen.findByText('studio videos marker')).toBeInTheDocument();
		expect(createdBodies).toEqual([]);
		expect(presignQueries).toEqual([{ id: 6, path: 'overnight-queue-03.mp4' }]);
		expect(confirmCalls).toHaveLength(1);
		expect(queueCalls).toHaveLength(1);
	});

	it('offers a channel picker when the viewer owns more than one channel', async () => {
		const user = userEvent.setup();
		const channels = [
			makeChannel({ id: 1, username: 'nightwatch', name: 'Night Watch' }),
			makeChannel({ id: 5, username: 'mine', name: 'My Channel' }),
		];
		installPipeline();
		const view = mount();
		view.queryClient.setQueryData<Me>(['me'], makeMe({ channels, currentChannelId: 5 }));

		const radio = await screen.findByRole('radio', { name: /nightwatch/ });
		expect(radio).not.toBeChecked();
		expect(screen.getByRole('radio', { name: /mine/ })).toBeChecked();

		await user.click(radio);
		expect(radio).toBeChecked();

		await fillMetadata(user);
		await pickFile(user);

		await screen.findByText('studio videos marker');
		expect(createdBodies[0]?.channelId).toBe(1);
	});
});
