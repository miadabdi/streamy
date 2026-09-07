import { BadRequestException } from '@nestjs/common';
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

describe('VideoService sendVideoInProcessQueue', () => {
	let service: VideoService;
	let videosFindFirst: ReturnType<typeof vi.fn>;
	let addToQueue: ReturnType<typeof vi.fn>;
	let setCalls: Array<Record<string, unknown>>;

	const user = { id: 1 } as any;

	const videoFixture = (overrides: Record<string, unknown> = {}) => ({
		id: 9,
		processingStatus: 'ready_for_processing',
		channel: { ownerId: 1 },
		videoFile: {
			id: 44,
			bucketName: 'videos',
			path: 'abc.mp4',
			sizeInByte: 10,
			mimetype: 'video/mp4',
		},
		subtitles: [
			{
				id: 2,
				langRFC5646: 'en',
				file: {
					id: 45,
					bucketName: 'subtitlefiles',
					path: 'en.srt',
					sizeInByte: 5,
					mimetype: 'text/plain',
				},
			},
		],
		...overrides,
	});

	beforeEach(async () => {
		videosFindFirst = vi.fn();
		addToQueue = vi.fn().mockResolvedValue(undefined);
		setCalls = [];

		const update = vi.fn().mockImplementation((table: unknown) => ({
			set: vi.fn().mockImplementation((setArg: Record<string, unknown>) => {
				setCalls.push(setArg);
				return {
					where: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue(undefined) }),
				};
			}),
		}));

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { videos: { findFirst: videosFindFirst } }, update },
					},
				},
				{ provide: MinioClientService, useValue: {} },
				{ provide: FileService, useValue: {} },
				{ provide: ChannelService, useValue: {} },
				{ provide: ProducerService, useValue: { addToQueue } },
				{ provide: ConsumerService, useValue: {} },
				{ provide: TagService, useValue: {} },
				{ provide: PlaylistService, useValue: {} },
				{ provide: VideoSearchService, useValue: {} },
			],
		}).compile();
		service = moduleRef.get(VideoService);
	});

	it('rejects a video that is not ready_for_processing', async () => {
		videosFindFirst.mockResolvedValue(videoFixture({ processingStatus: 'processing' }));

		await expect(service.sendVideoInProcessQueue({ id: 9 } as any, user)).rejects.toThrow(
			BadRequestException,
		);
		expect(addToQueue).not.toHaveBeenCalled();
	});

	it('publishes the video and its subtitles and marks it waiting_in_queue', async () => {
		videosFindFirst.mockResolvedValue(videoFixture());

		const result = await service.sendVideoInProcessQueue({ id: 9 } as any, user);

		expect(result.message).toContain('successfully');
		expect(addToQueue).toHaveBeenCalledWith('q.video.process', {
			videoId: 9,
			fileId: 44,
			bucketName: 'videos',
			filePath: 'abc.mp4',
			sizeInByte: 10,
			mimetype: 'video/mp4',
			subs: [
				{
					id: 2,
					langRFC5646: 'en',
					fileId: 45,
					bucketName: 'subtitlefiles',
					filePath: 'en.srt',
					sizeInByte: 5,
					mimetype: 'text/plain',
				},
			],
		});
		expect(setCalls.some((s) => s.processingStatus === 'waiting_in_queue')).toBe(true);
	});
});
