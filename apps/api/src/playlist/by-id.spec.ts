import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

// Same shape as by-channel.spec.ts: the real PlaylistService runs over a
// mocked drizzle, so ownership semantics come from real code paths.
describe('PlaylistService getPlaylistById owner gating', () => {
	let service: PlaylistService;
	let playlistsFindFirst: ReturnType<typeof vi.fn>;

	const user = { id: 1, email: 'owner@example.com' } as any;
	const playlist = (overrides: Record<string, unknown> = {}) =>
		({
			id: 10,
			channel: { ownerId: 1 },
			playlistsVideos: [{ videoId: 5 }],
			...overrides,
		}) as any;

	beforeEach(async () => {
		playlistsFindFirst = vi.fn().mockResolvedValue(playlist());

		const moduleRef = await Test.createTestingModule({
			providers: [
				PlaylistService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { playlists: { findFirst: playlistsFindFirst } } },
					},
				},
				{ provide: ChannelService, useValue: {} },
			],
		}).compile();
		service = moduleRef.get(PlaylistService);
	});

	it("returns the playlist to its channel's owner", async () => {
		const row = playlist();
		playlistsFindFirst.mockResolvedValue(row);

		await expect(service.getPlaylistById(10, user)).resolves.toBe(row);
	});

	it("hides another user's playlist (no existence oracle)", async () => {
		playlistsFindFirst.mockResolvedValue(playlist({ channel: { ownerId: 42 } }));

		await expect(service.getPlaylistById(10, { id: 2 } as any)).rejects.toThrow(NotFoundException);
	});

	it('treats a nonexistent playlist the same as a foreign one', async () => {
		playlistsFindFirst.mockResolvedValue(undefined);

		await expect(service.getPlaylistById(404, user)).rejects.toThrow(NotFoundException);
	});

	it('keeps the response shape unchanged: the gate-only channel is not in the payload query', async () => {
		await service.getPlaylistById(10, user);

		expect(playlistsFindFirst).toHaveBeenCalledTimes(2);
		expect(playlistsFindFirst.mock.calls[0][0].with).toEqual({ channel: true });
		expect(Object.keys(playlistsFindFirst.mock.calls[1][0].with)).not.toContain('channel');
	});
});

describe('PlaylistController /by-id wiring', () => {
	const playlistServiceMock = {
		getPlaylistById: vi.fn().mockResolvedValue({ id: 10 }),
	};
	const controller = new PlaylistController(playlistServiceMock as any, {} as any);

	it('passes the requesting user through to the service', async () => {
		const user = { id: 1 } as any;

		await controller.getPlaylistById({ id: 10 } as any, user);

		expect(playlistServiceMock.getPlaylistById).toHaveBeenCalledWith(10, user);
	});

	it('stays behind the jwt guard (own-library route, not @Public)', () => {
		expect(new Reflector().get('isPublic', controller.getPlaylistById)).toBeUndefined();
	});
});
