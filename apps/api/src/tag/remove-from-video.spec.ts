import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { MinioClientService } from '../minio-client/minio-client.service';
import { PlaylistService } from '../playlist/playlist.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import VideoSearchService from '../search/video-search.service';
import { VideoService } from '../video/video.service';
import { TagService } from './tags.service';

// Same shape as confirm-upload.spec.ts: the real VideoService runs
// userOwnsVideo against a mocked drizzle, so NotFound/Forbidden come from
// the shared helper exactly as in the sibling specs.
describe('TagService removeTagFromVideo', () => {
	let service: TagService;
	let videosFindFirst: ReturnType<typeof vi.fn>;
	let deleteExecute: ReturnType<typeof vi.fn>;
	let deleteCalls: number;

	const user = { id: 1, email: 'owner@example.com' } as any;
	const ownedVideo = (overrides: Record<string, unknown> = {}) => ({
		id: 5,
		channel: { ownerId: 1 },
		...overrides,
	});

	beforeEach(async () => {
		videosFindFirst = vi.fn();
		deleteExecute = vi.fn();
		deleteCalls = 0;

		const moduleRef = await Test.createTestingModule({
			providers: [
				TagService,
				VideoService,
				{ provide: ConfigService, useValue: {} },
				{
					provide: DrizzleService,
					useValue: {
						db: {
							query: {
								videos: { findFirst: videosFindFirst },
							},
							// tagsVideos delete chain: delete().where().returning().execute()
							delete: vi.fn().mockImplementation(() => {
								deleteCalls++;
								return {
									where: vi.fn().mockReturnValue({
										returning: vi.fn().mockReturnValue({ execute: deleteExecute }),
									}),
								};
							}),
						},
					},
				},
				{ provide: MinioClientService, useValue: {} },
				{ provide: FileService, useValue: {} },
				{ provide: ChannelService, useValue: {} },
				{ provide: ProducerService, useValue: {} },
				{ provide: ConsumerService, useValue: {} },
				{ provide: PlaylistService, useValue: {} },
				{ provide: VideoSearchService, useValue: {} },
			],
		}).compile();

		service = moduleRef.get(TagService);
	});

	it('rejects with NotFoundException when the video does not exist', async () => {
		videosFindFirst.mockResolvedValue(undefined);

		await expect(service.removeTagFromVideo({ videoId: 5, tagId: 7 }, user)).rejects.toThrow(
			NotFoundException,
		);
		expect(deleteCalls).toBe(0);
	});

	it('rejects with ForbiddenException when the user does not own the video', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo({ channel: { ownerId: 42 } }));

		await expect(service.removeTagFromVideo({ videoId: 5, tagId: 7 }, user)).rejects.toThrow(
			ForbiddenException,
		);
		expect(deleteCalls).toBe(0);
	});

	it('rejects with NotFoundException when the tag is not on the video', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo());
		deleteExecute.mockResolvedValue([]);

		await expect(service.removeTagFromVideo({ videoId: 5, tagId: 7 }, user)).rejects.toThrow(
			NotFoundException,
		);
	});

	it('removes the tag and returns the message when it was attached', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo());
		deleteExecute.mockResolvedValue([{ tagId: 7 }]);

		await expect(service.removeTagFromVideo({ videoId: 5, tagId: 7 }, user)).resolves.toEqual({
			message: 'Tag was removed from the video',
		});
		expect(deleteCalls).toBe(1);
	});
});
