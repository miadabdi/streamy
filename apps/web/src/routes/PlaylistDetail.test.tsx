import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { playlistPool, seedPlaylists } from '../test/handlers/playlist';
import { renderWithApp } from '../test/render';
import { PlaylistDetail } from './PlaylistDetail';

beforeEach(() => seedPlaylists());

function mount(id: number) {
	return renderWithApp(
		<Routes>
			<Route path="/playlists/:id" element={<PlaylistDetail />} />
			<Route path="/playlists" element={<p>list marker</p>} />
			<Route path="/watch/:id" element={<p>watch marker</p>} />
		</Routes>,
		{ route: `/playlists/${id}` },
	);
}

function playlist(id: number) {
	return playlistPool.find((p) => p.id === id)!;
}

describe('PlaylistDetail', () => {
	it('renders the playlist with its videos as cards', async () => {
		mount(10);

		expect(await screen.findByRole('heading', { name: 'Rack diaries', level: 1 })).toBeInTheDocument();
		expect(screen.getByText(/2 videos/)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Rebuilding the rack/ })).toHaveAttribute(
			'href',
			'/watch/1',
		);
		expect(screen.getByRole('link', { name: /With thumbnail video/ })).toHaveAttribute(
			'href',
			'/watch/3',
		);
	});

	it('renames and redescription through the edit form', async () => {
		const user = userEvent.setup();
		mount(10);
		await screen.findByRole('heading', { name: 'Rack diaries', level: 1 });

		const name = screen.getByLabelText('Name');
		await user.clear(name);
		await user.type(name, 'Rack diaries II');
		const description = screen.getByLabelText('Description');
		await user.clear(description);
		await user.type(description, 'The rack, revisited in order');
		await user.click(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(() =>
			expect(playlist(10)).toMatchObject({
				name: 'Rack diaries II',
				description: 'The rack, revisited in order',
			}),
		);
		expect(await screen.findByRole('heading', { name: 'Rack diaries II', level: 1 })).toBeInTheDocument();
	});

	it('toggles privacy through the switch', async () => {
		const user = userEvent.setup();
		mount(10); // seeded public
		await screen.findByRole('heading', { name: 'Rack diaries', level: 1 });

		const toggle = screen.getByRole('checkbox', { name: 'Public' });
		expect(toggle).toBeChecked();
		await user.click(toggle);

		await waitFor(() => expect(playlist(10).privacy).toBe('private'));
		expect(await screen.findByRole('checkbox', { name: 'Public' })).not.toBeChecked();
	});

	it('deletes a custom playlist behind a confirm dialog and returns to the list', async () => {
		const user = userEvent.setup();
		mount(10);
		await screen.findByRole('heading', { name: 'Rack diaries', level: 1 });

		await user.click(screen.getByRole('button', { name: 'Delete playlist' }));
		expect(screen.getByText('Delete “Rack diaries”?')).toBeInTheDocument();

		// cancel first: nothing happens
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Keep it' }));
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(playlist(10).isActive).toBe(true);

		await user.click(screen.getByRole('button', { name: 'Delete playlist' }));
		await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete playlist' }));

		expect(await screen.findByText('list marker')).toBeInTheDocument();
		expect(playlist(10).isActive).toBe(false);
	});

	it('adds a found video to the playlist', async () => {
		const user = userEvent.setup();
		mount(11); // 'ffmpeg things I keep forgetting' — empty
		await screen.findByRole('heading', { name: 'ffmpeg things I keep forgetting', level: 1 });

		await user.type(screen.getByLabelText('Search videos to add'), 'rack');
		const row = await screen.findByText('Rebuilding the rack');
		await user.click(within(row.closest('li') as HTMLElement).getByRole('button', { name: 'Add' }));

		expect(await screen.findByRole('link', { name: /Rebuilding the rack/ })).toHaveAttribute(
			'href',
			'/watch/1',
		);
		expect(playlist(11).playlistsVideos.map((pv) => pv.video.id)).toEqual([1]);
	});

	it('renders system playlists read-only, with no edit affordances', async () => {
		mount(12); // Liked videos (type: likes)

		expect(await screen.findByRole('heading', { name: 'Liked videos', level: 1 })).toBeInTheDocument();
		expect(screen.getByText(/system playlist/i)).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /Rebuilding the rack/ })).toHaveAttribute(
			'href',
			'/watch/1',
		);
		expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
		expect(screen.queryByRole('button', { name: 'Delete playlist' })).toBeNull();
		expect(screen.queryByRole('checkbox', { name: 'Public' })).toBeNull();
		expect(screen.queryByLabelText('Search videos to add')).toBeNull();
	});
});
