import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeChannel, makeMe, makePlaylist } from '../test/fixtures';
import { playlistPool, seedPlaylists } from '../test/handlers/playlist';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { Playlists } from './Playlists';

beforeEach(() => seedPlaylists());

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/playlists" element={<Playlists />} />
			<Route path="/playlists/:id" element={<p>detail marker</p>} />
		</Routes>,
		{ route: '/playlists' },
	);
}

function systemRow(name: string): HTMLElement {
	return screen.getByText(name).closest('tr') as HTMLElement;
}

describe('Playlists', () => {
	it("lists the current channel's custom playlists with counts and privacy", async () => {
		mount();

		expect(await screen.findByText('Rack diaries')).toBeInTheDocument();
		expect(screen.getByText('2 videos')).toBeInTheDocument();
		expect(screen.getByText('ffmpeg things I keep forgetting')).toBeInTheDocument();
		expect(screen.getByText('0 videos')).toBeInTheDocument();
		expect(screen.getByText('public')).toBeInTheDocument();
		expect(screen.getByText('private')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Rack diaries/ })).toHaveAttribute(
			'href',
			'/playlists/10',
		);
	});

	it('surfaces the system playlists in a read-only table with their counts', async () => {
		mount();
		await screen.findByText('Liked videos');

		expect(within(systemRow('Liked videos')).getByText('2')).toBeInTheDocument();
		expect(within(systemRow('Disliked videos')).getByText('1')).toBeInTheDocument();
		expect(
			within(systemRow('Liked videos')).getByRole('link', { name: 'Open' }),
		).toHaveAttribute('href', '/playlists/12');
		// system rows offer no editing affordances
		expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
	});

	it('shows the empty state when the channel has no playlists at all', async () => {
		playlistPool.length = 0;
		mount();

		expect(await screen.findByText('No playlists yet')).toBeInTheDocument();
		expect(document.querySelector('.vgrid')).toBeNull();
		expect(document.querySelector('table')).toBeNull();
	});

	it('creates a playlist through the new-playlist dialog', async () => {
		const user = userEvent.setup();
		mount();
		await screen.findByText('Rack diaries');

		await user.click(screen.getByRole('button', { name: 'New playlist' }));
		await user.type(screen.getByLabelText('Name'), 'Night builds');
		await user.type(screen.getByLabelText('Description'), 'Builds that ran overnight');
		await user.click(screen.getByRole('button', { name: 'Create playlist' }));

		expect(await screen.findByRole('link', { name: /Night builds/ })).toHaveAttribute(
			'href',
			'/playlists/100',
		);
		const created = playlistPool.find((p) => p.name === 'Night builds');
		expect(created).toMatchObject({
			channelId: 1,
			description: 'Builds that ran overnight',
			privacy: 'private',
			type: 'custom',
		});
	});

	it('switches the library with the channel picker when the viewer has several channels', async () => {
		server.use(
			http.get('/api/v1/playlist/by-channel', ({ request }) => {
				const channelId = Number(new URL(request.url).searchParams.get('channelId'));
				return HttpResponse.json(
					channelId === 2
						? [makePlaylist({ id: 20, name: 'Kbench cuts', channelId: 2 })]
						: playlistPool.filter((p) => p.channelId === 1 && p.isActive !== false),
				);
			}),
		);
		const user = userEvent.setup();
		const { queryClient } = mount();
		await screen.findByText('Rack diaries');
		queryClient.setQueryData(
			['me'],
			makeMe({
				channels: [makeChannel(), makeChannel({ id: 2, username: 'kbench', name: 'kbench' })],
			}),
		);

		await user.click(await screen.findByRole('radio', { name: /kbench/ }));

		expect(await screen.findByText('Kbench cuts')).toBeInTheDocument();
		expect(screen.queryByText('Rack diaries')).toBeNull();
	});
});
