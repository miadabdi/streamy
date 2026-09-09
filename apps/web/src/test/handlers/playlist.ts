import { http, HttpResponse } from 'msw';
import { makePlaylist, type Playlist, type VideoListItem } from '../fixtures';
import { videoPool } from './video';

// In-memory playlist library, mutated in place by the write handlers like
// MyVideos' pool. seedPlaylists() runs at import and again from each test's
// beforeEach — the exported array identity never changes, so tests can assert
// against it directly.
type Seeded = Playlist & { playlistsVideos: NonNullable<Playlist['playlistsVideos']> };

// GET /playlist/by-channel|by-id embed video + thumbnailFile only.
function entry(videoId: number): { video: VideoListItem } {
	const video = videoPool.find((v) => v.id === videoId) ?? videoPool[0];
	return { video };
}

export const playlistPool: Seeded[] = [];

let nextId = 100;

export function seedPlaylists() {
	nextId = 100;
	playlistPool.length = 0;
	playlistPool.push(
		makePlaylist({
			id: 10,
			name: 'Rack diaries',
			privacy: 'public',
			playlistsVideos: [entry(1), entry(3)],
		}) as Seeded,
		makePlaylist({ id: 11, name: 'ffmpeg things I keep forgetting' }) as Seeded,
		makePlaylist({
			id: 12,
			name: 'Liked videos',
			type: 'likes',
			playlistsVideos: [entry(1), entry(2)],
		}) as Seeded,
		makePlaylist({
			id: 13,
			name: 'Disliked videos',
			type: 'dislikes',
			playlistsVideos: [entry(3)],
		}) as Seeded,
		makePlaylist({ id: 14, name: 'Watched', type: 'watched' }) as Seeded,
	);
}

export const playlistHandlers = [
	http.get('/api/v1/playlist/by-channel', ({ request }) => {
		const channelId = Number(new URL(request.url).searchParams.get('channelId'));
		return HttpResponse.json(
			playlistPool.filter((p) => p.channelId === channelId && p.isActive !== false),
		);
	}),
	http.get('/api/v1/playlist/by-id', ({ request }) => {
		const id = Number(new URL(request.url).searchParams.get('id'));
		return HttpResponse.json(playlistPool.find((p) => p.id === id && p.isActive !== false) ?? null);
	}),
	http.post('/api/v1/playlist', async ({ request }) => {
		const body = (await request.json()) as {
			name: string;
			description: string;
			channelId: number;
			privacy?: Playlist['privacy'];
		};
		const created = makePlaylist({
			id: nextId++,
			name: body.name,
			description: body.description,
			channelId: body.channelId,
			privacy: body.privacy ?? 'private',
		}) as Seeded;
		playlistPool.push(created);
		return HttpResponse.json(created, { status: 201 });
	}),
	http.patch('/api/v1/playlist', async ({ request }) => {
		const body = (await request.json()) as Partial<Playlist> & { id: number };
		const playlist = playlistPool.find((p) => p.id === body.id);
		if (!playlist) return new HttpResponse(null, { status: 404 });
		Object.assign(playlist, body);
		return HttpResponse.json(playlist);
	}),
	http.delete('/api/v1/playlist', ({ request }) => {
		const id = Number(new URL(request.url).searchParams.get('id'));
		const playlist = playlistPool.find((p) => p.id === id);
		if (!playlist) return new HttpResponse(null, { status: 404 });
		playlist.isActive = false; // soft delete, same as the service
		return HttpResponse.json({ message: 'Playlist Deleted Successfully' });
	}),
	http.post('/api/v1/playlist/add-videos', async ({ request }) => {
		const body = (await request.json()) as { playlistId: number; videoIds: number[] };
		const playlist = playlistPool.find((p) => p.id === body.playlistId);
		if (!playlist) return new HttpResponse(null, { status: 404 });
		for (const videoId of body.videoIds) {
			if (!playlist.playlistsVideos.some((pv) => pv.video.id === videoId)) {
				playlist.playlistsVideos.push(entry(videoId));
			}
		}
		return HttpResponse.json({ message: 'Videos were added to the playlist' }, { status: 201 });
	}),
];

seedPlaylists();
