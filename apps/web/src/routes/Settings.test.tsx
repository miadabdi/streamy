import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChannel, makeFile, makeMe, type Me } from '../test/fixtures';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { Settings } from './Settings';

// Two owned channels so the switcher has somewhere to switch to.
function me(): Me {
	return makeMe({
		firstName: 'Mia',
		lastName: 'Doe',
		currentChannelId: 1,
		channels: [
			makeChannel({
				id: 1,
				username: 'nightwatch',
				name: 'Night Watch',
				description: 'Overnight transcodes.',
				numberOfSubscribers: 184,
			}),
			makeChannel({
				id: 2,
				username: 'kbench',
				name: 'kbench',
				description: 'Keyboard salvage.',
				numberOfSubscribers: 41,
			}),
		],
	});
}

const profileBodies: object[] = [];
const channelBodies: object[] = [];
const patchCalls: number[] = [];
const switchBodies: object[] = [];

async function mount(meValue: Me = me()) {
	const view = renderWithApp(
		<Routes>
			<Route path="/settings" element={<Settings />} />
		</Routes>,
		{ route: '/settings' },
	);
	act(() => view.queryClient.setQueryData(['me'], meValue));
	// the observer notification lands on a macrotask — let it flush before the
	// first (synchronous) query runs
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 10));
	});
	return view;
}

/** The card row a channel is rendered in (matched on its @username meta line). */
function channelRow(username: string): HTMLElement {
	return screen.getByText(new RegExp(`@${username}\\b`)).closest('div.card') as HTMLElement;
}

beforeEach(() => {
	profileBodies.length = 0;
	channelBodies.length = 0;
	patchCalls.length = 0;
	switchBodies.length = 0;
});

describe('Settings — profile', () => {
	it('patches only the dirty fields and disables save while clean', async () => {
		server.use(
			http.patch('/api/v1/user/update-me', async ({ request }) => {
				profileBodies.push((await request.json()) as object);
				return HttpResponse.json(me());
			}),
		);
		const user = userEvent.setup();
		await mount();

		expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();

		const first = screen.getByLabelText('First name');
		await user.clear(first);
		await user.type(first, 'Miah');
		await user.click(screen.getByRole('button', { name: 'Save profile' }));

		await vi.waitFor(() => expect(profileBodies).toEqual([{ firstName: 'Miah' }]));
	});

	it('shows the sign-in address read-only', async () => {
		await mount();

		expect(screen.getByLabelText('Email')).toHaveAttribute('disabled');
		expect(screen.getByDisplayValue('user@example.com')).toBeDisabled();
	});
});

describe('Settings — new channel', () => {
	it('rejects a short/spaced username client-side and never posts', async () => {
		const user = userEvent.setup();
		await mount();

		await user.type(screen.getByLabelText('Channel username'), 'kb nch');
		await user.click(screen.getByRole('button', { name: 'Create channel' }));

		expect(
			await screen.findByText('Channel username must be at least 8 characters'),
		).toBeInTheDocument();
		expect(channelBodies).toEqual([]);
	});

	it('creates the channel and lists it after the me refetch', async () => {
		let meNow = me();
		server.use(
			http.get('/api/v1/user/me', () => HttpResponse.json(meNow)),
			http.post('/api/v1/channel', async ({ request }) => {
				const body = (await request.json()) as { username: string; name: string; description: string };
				channelBodies.push(body);
				const channel = makeChannel({ id: 9, ...body });
				meNow = { ...meNow, channels: [...meNow.channels, channel] };
				return HttpResponse.json(channel, { status: 201 });
			}),
		);
		const user = userEvent.setup();
		await mount();

		await user.type(screen.getByLabelText('Channel username'), 'longwavehq');
		await user.type(screen.getByLabelText('Display name'), 'Longwave');
		await user.type(screen.getByLabelText('Description'), 'Repair bench diaries.');
		await user.click(screen.getByRole('button', { name: 'Create channel' }));

		await vi.waitFor(() => expect(channelBodies).toEqual([
			{ username: 'longwavehq', name: 'Longwave', description: 'Repair bench diaries.' },
		]));
		await vi.waitFor(() => expect(screen.getByText(/@longwavehq\b/)).toBeInTheDocument());
	});
});

describe('Settings — edit channel', () => {
	it('patches name/description plus the avatar as multipart (FileInterceptor field "avatar")', async () => {
		server.use(
			http.get('/api/v1/channel/by-id', () =>
				HttpResponse.json({ ...me().channels[0], avatar: null }),
			),
			// body stays unread: msw cannot re-read undici-serialized FormData under
			// jsdom — the multipart shape is pinned in forms.test.ts
			http.patch('/api/v1/channel', () => {
				patchCalls.push(1);
				return HttpResponse.json(makeChannel({ id: 1, name: 'Night Watch HQ' }));
			}),
		);
		const user = userEvent.setup();
		await mount();

		await user.click(within(channelRow('nightwatch')).getByRole('button', { name: 'Edit' }));
		const form = within(await screen.findByRole('form', { name: 'Edit channel' }));
		const name = form.getByLabelText('Display name');
		await user.clear(name);
		await user.type(name, 'Night Watch HQ');
		await user.upload(
			form.getByLabelText('Channel avatar file'),
			new File(['x'], 'logo.png', { type: 'image/png' }),
		);
		await user.click(form.getByRole('button', { name: 'Save channel' }));

		await vi.waitFor(() => expect(patchCalls).toHaveLength(1));
		// success closes the edit form
		await vi.waitFor(() =>
			expect(screen.queryByRole('form', { name: 'Edit channel' })).toBeNull(),
		);
	});

	it('serves the stored avatar from /storage/channelavatars', async () => {
		const withAvatar = me();
		withAvatar.channels[0].avatarFileId = 901;
		server.use(
			http.get('/api/v1/channel/by-id', () =>
				HttpResponse.json({
					...withAvatar.channels[0],
					avatar: makeFile({ id: 901, bucketName: 'channelavatars', path: 'logo.jpg' }),
				}),
			),
		);
		const user = userEvent.setup();
		await mount(withAvatar);

		await user.click(within(channelRow('nightwatch')).getByRole('button', { name: 'Edit' }));
		const form = await screen.findByRole('form', { name: 'Edit channel' });

		expect(form.querySelector('img')).toHaveAttribute('src', '/storage/channelavatars/logo.jpg');
	});
});

describe('Settings — current-channel switcher', () => {
	it('marks the current channel and switches with me + channel-scoped invalidation', async () => {
		server.use(
			http.patch('/api/v1/user/set-current-channel', async ({ request }) => {
				switchBodies.push((await request.json()) as object);
				return HttpResponse.json(me());
			}),
		);
		const user = userEvent.setup();
		const { queryClient } = await mount();
		// channel-scoped caches exist for the old current channel
		queryClient.setQueryData(['studio-videos', 'vod'], []);
		queryClient.setQueryData(['playlists', 1], []);
		const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

		// the prominent block names what everything operates as
		expect(screen.getByText('current channel')).toBeInTheDocument();
		expect(within(channelRow('nightwatch')).getByText('current')).toBeInTheDocument();

		await user.click(within(channelRow('kbench')).getByRole('button', { name: 'Make current' }));

		await vi.waitFor(() => expect(switchBodies).toEqual([{ currentChannelId: 2 }]));
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me'] });
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['studio-videos'] });
		expect(invalidate).toHaveBeenCalledWith({ queryKey: ['playlists'] });
	});
});

describe('Settings — session', () => {
	it('signs out without a confirm and clears the query cache', async () => {
		let signedOut = 0;
		server.use(
			http.post('/api/v1/auth/signout', () => {
				signedOut++;
				return new HttpResponse(null, { status: 200 });
			}),
		);
		const user = userEvent.setup();
		const { queryClient } = await mount();
		const clear = vi.spyOn(queryClient, 'clear');

		await user.click(screen.getByRole('button', { name: 'Sign out' }));

		await vi.waitFor(() => expect(signedOut).toBe(1));
		await vi.waitFor(() => expect(clear).toHaveBeenCalled());
		expect(queryClient.getQueryData(['me'])).toBeUndefined();
	});
});
