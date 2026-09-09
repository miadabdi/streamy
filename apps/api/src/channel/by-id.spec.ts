import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { PlaylistService } from '../playlist/playlist.service';
import { ChannelService } from './channel.service';

// Same shape as public-read.spec.ts: the real ChannelService runs over a
// mocked drizzle; the fix is the query shape, so the with-clause is pinned.
describe('ChannelService getChannelById payload trim', () => {
	let service: ChannelService;
	let channelsFindFirst: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		channelsFindFirst = vi.fn().mockResolvedValue({ id: 3, ownerId: 1, avatar: {} });

		const moduleRef = await Test.createTestingModule({
			providers: [
				ChannelService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { channels: { findFirst: channelsFindFirst } } },
					},
				},
				{ provide: FileService, useValue: {} },
				{ provide: PlaylistService, useValue: {} },
			],
		}).compile();
		service = moduleRef.get(ChannelService);
	});

	it('loads scalars + avatar + subscriptions but no playlists (edit-form read)', async () => {
		await service.getChannelById(3);

		expect(channelsFindFirst.mock.calls[0][0].with).toEqual({
			subscriptions: { with: { followee: { with: { avatar: true } } } },
			avatar: true,
		});
	});

	it('returns null for a nonexistent channel without throwing', async () => {
		channelsFindFirst.mockResolvedValue(undefined);

		await expect(service.getChannelById(404)).resolves.toBeUndefined();
	});
});
