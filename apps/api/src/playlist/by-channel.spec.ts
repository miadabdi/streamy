import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

const dialect = new PgDialect();

// Same shape as public-read.spec.ts / remove-from-video.spec.ts: the real
// PlaylistService and ChannelService run over a mocked drizzle, so ownership
// semantics come from real code paths.
describe('PlaylistController /by-channel', () => {
	let controller: PlaylistController;
	let channelsFindFirst: ReturnType<typeof vi.fn>;
	let playlistsFindMany: ReturnType<typeof vi.fn>;

	const user = { id: 1, email: 'owner@example.com' } as any;

	beforeEach(async () => {
		channelsFindFirst = vi.fn().mockResolvedValue({ id: 3, ownerId: 1 });
		playlistsFindMany = vi.fn().mockResolvedValue([{ id: 10 }, { id: 11 }]);

		const moduleRef = await Test.createTestingModule({
			providers: [
				PlaylistController,
				PlaylistService,
				ChannelService,
				{
					provide: DrizzleService,
					useValue: {
						db: {
							query: {
								channels: { findFirst: channelsFindFirst },
								playlists: { findMany: playlistsFindMany },
							},
						},
					},
				},
				{ provide: FileService, useValue: {} },
			],
		}).compile();
		controller = moduleRef.get(PlaylistController);
	});

	it("returns the channel owner's playlists", async () => {
		const result = await controller.getPlaylistsOfChannel({ channelId: 3 } as any, user);

		expect(result).toEqual([{ id: 10 }, { id: 11 }]);
	});

	it('passes channelId through to the playlists query', async () => {
		await controller.getPlaylistsOfChannel({ channelId: 3 } as any, user);

		const rendered = dialect.sqlToQuery(playlistsFindMany.mock.calls[0][0].where);
		expect(rendered.sql).toContain('channel_id');
		expect(rendered.params[0]).toBe(3);
	});

	it('rejects with ForbiddenException when the user does not own the channel', async () => {
		channelsFindFirst.mockResolvedValue({ id: 3, ownerId: 42 });

		await expect(controller.getPlaylistsOfChannel({ channelId: 3 } as any, user)).rejects.toThrow(
			ForbiddenException,
		);
		expect(playlistsFindMany).not.toHaveBeenCalled();
	});

	it('treats a nonexistent channel the same as a foreign one (no existence oracle)', async () => {
		channelsFindFirst.mockResolvedValue(null);

		await expect(controller.getPlaylistsOfChannel({ channelId: 404 } as any, user)).rejects.toThrow(
			ForbiddenException,
		);
		expect(playlistsFindMany).not.toHaveBeenCalled();
	});

	it('stays behind the jwt guard (own-library route, not @Public)', () => {
		const reflector = new Reflector();

		expect(reflector.get('isPublic', controller.getPlaylistsOfChannel)).toBeUndefined();
	});
});
