import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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

describe('VideoService confirmUpload', () => {
	let service: VideoService;
	let videosFindFirst: ReturnType<typeof vi.fn>;
	let filesFindFirst: ReturnType<typeof vi.fn>;
	let update: ReturnType<typeof vi.fn>;
	let setCalls: Array<{ table: unknown; setArg: Record<string, unknown> }>;
	let statObject: ReturnType<typeof vi.fn>;

	const user = { id: 1, email: 'owner@example.com' } as any;
	const ownedVideo = (overrides: Record<string, unknown> = {}) => ({
		id: 5,
		channel: { ownerId: 1 },
		videoFile: { id: 9, bucketName: 'videos', path: 'abc-video.mp4' },
		...overrides,
	});

	const makeUpdateChain = () =>
		vi.fn().mockImplementation((table: unknown) => {
			const set = vi.fn().mockImplementation((setArg: Record<string, unknown>) => {
				setCalls.push({ table, setArg });
				return {
					where: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue(undefined) }),
				};
			});
			return { set };
		});

	beforeEach(async () => {
		videosFindFirst = vi.fn();
		filesFindFirst = vi.fn();
		setCalls = [];
		update = makeUpdateChain();
		statObject = vi.fn();

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: DrizzleService,
					useValue: {
						db: {
							query: {
								videos: { findFirst: videosFindFirst },
								files: { findFirst: filesFindFirst },
							},
							update,
						},
					},
				},
				{ provide: MinioClientService, useValue: { client: { statObject } } },
				{ provide: FileService, useValue: {} },
				{ provide: ChannelService, useValue: {} },
				{ provide: ProducerService, useValue: {} },
				{ provide: ConsumerService, useValue: {} },
				{ provide: TagService, useValue: {} },
				{ provide: PlaylistService, useValue: {} },
				{ provide: VideoSearchService, useValue: {} },
			],
		}).compile();

		service = moduleRef.get(VideoService);
	});

	it('rejects with NotFoundException when the video does not exist', async () => {
		videosFindFirst.mockResolvedValue(undefined);

		await expect(service.confirmUpload(5, user)).rejects.toThrow(NotFoundException);
	});

	it('rejects with ForbiddenException when the user does not own the video', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo({ channel: { ownerId: 42 } }));

		await expect(service.confirmUpload(5, user)).rejects.toThrow(ForbiddenException);
	});

	it('rejects with BadRequestException when no file is attached to the video', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo({ videoFile: null }));

		await expect(service.confirmUpload(5, user)).rejects.toThrow(BadRequestException);
	});

	it('rejects with NotFoundException when the object is missing from storage', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo());
		statObject.mockRejectedValue(new Error('The specified key does not exist'));

		await expect(service.confirmUpload(5, user)).rejects.toThrow(NotFoundException);
	});

	it('marks the video ready_for_processing when the object exists', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo());
		statObject.mockResolvedValue({ size: 1234, metaData: { 'content-type': 'video/mp4' } });
		filesFindFirst.mockResolvedValue({ id: 9, bucketName: 'videos', path: 'abc-video.mp4' });

		const result = await service.confirmUpload(5, user);

		expect(result).toEqual({ message: 'Upload confirmed successfully' });
		expect(statObject).toHaveBeenCalledWith('videos', 'abc-video.mp4');
		const videoUpdate = setCalls.find((c) => (c.setArg as any).processingStatus !== undefined);
		expect(videoUpdate?.setArg.processingStatus).toBe('ready_for_processing');
	});

	it('tolerates content-type casing from the s3 implementation', async () => {
		videosFindFirst.mockResolvedValue(ownedVideo());
		statObject.mockResolvedValue({ size: 1234, metaData: { 'Content-Type': 'video/mp4' } });
		filesFindFirst.mockResolvedValue({ id: 9, bucketName: 'videos', path: 'abc-video.mp4' });

		await service.confirmUpload(5, user);

		const fileUpdate = setCalls.find((c) => (c.setArg as any).mimetype !== undefined);
		expect(fileUpdate?.setArg.mimetype).toBe('video/mp4');
	});
});
