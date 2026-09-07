import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { MinioClientService } from '../minio-client/minio-client.service';
import { PlaylistService } from '../playlist/playlist.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import VideoSearchService from '../search/video-search.service';
import { TagService } from '../tag/tags.service';
import { VideoService } from './video.service';

describe('VideoService release indexing', () => {
	let service: VideoService;
	let videosFindFirst: vi.Mock;
	let indexVideo: vi.Mock;

	const user = { id: 1 } as any;

	const doneVideo = () => ({
		id: 9,
		name: 'e2e vod 045b',
		description: 'desc',
		channelId: 2,
		duration: 61,
		numberOfDislikes: 0,
		numberOfLikes: 0,
		numberOfVisits: 0,
		releasedAt: new Date(),
		processingStatus: 'done',
		channel: { ownerId: 1 },
	});

	beforeEach(async () => {
		videosFindFirst = vi.fn().mockResolvedValue(doneVideo());
		indexVideo = vi.fn().mockResolvedValue({});

		const update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({
					returning: vi.fn().mockReturnValue({
						execute: vi.fn().mockResolvedValue([doneVideo()]),
					}),
				}),
			}),
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: DrizzleService,
					useValue: {
						db: {
							query: { videos: { findFirst: videosFindFirst } },
							update,
						},
					},
				},
				{ provide: MinioClientService, useValue: {} },
				{ provide: FileService, useValue: {} },
				{ provide: ChannelService, useValue: {} },
				{ provide: ProducerService, useValue: {} },
				{ provide: ConsumerService, useValue: {} },
				{ provide: TagService, useValue: {} },
				{ provide: PlaylistService, useValue: {} },
				{ provide: VideoSearchService, useValue: { indexVideo } },
			],
		}).compile();
		service = moduleRef.get(VideoService);
	});

	it('reindexes the full document so the name stays searchable', async () => {
		await service.releaseVideo(9, user);

		expect(indexVideo).toHaveBeenCalledTimes(1);
		const body = indexVideo.mock.calls[0][0];
		expect(body.name).toBe('e2e vod 045b');
		expect(body.releasedAt).toBeTruthy();
	});

	it('still rejects non-done videos', async () => {
		videosFindFirst.mockResolvedValue({ ...doneVideo(), processingStatus: 'processing' });

		await expect(service.releaseVideo(9, user)).rejects.toThrow(ForbiddenException);
	});
});
