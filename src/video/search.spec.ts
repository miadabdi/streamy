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

describe('VideoService search', () => {
	let service: VideoService;
	let search: jest.Mock;
	let findMany: jest.Mock;
	let selectFromWhereExecute: jest.Mock;

	const user = { id: 1, currentChannelId: 3 } as any;
	const dto = (overrides: Record<string, unknown> = {}) =>
		({
			text: 'anything',
			offset: 0,
			limit: 10,
			type: 'vod',
			onlySubbed: false,
			...overrides,
		}) as any;

	beforeEach(async () => {
		search = jest.fn().mockResolvedValue([{ id: 11 }, { id: 22 }]);
		findMany = jest.fn().mockResolvedValue([{ id: 11 }, { id: 22 }]);
		selectFromWhereExecute = jest.fn().mockResolvedValue([]);

		const select = jest.fn().mockReturnValue({
			from: jest.fn().mockReturnValue({
				where: jest.fn().mockReturnValue({ execute: selectFromWhereExecute }),
			}),
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { videos: { findMany } }, select },
					},
				},
				{ provide: MinioClientService, useValue: {} },
				{ provide: FileService, useValue: {} },
				{ provide: ChannelService, useValue: {} },
				{ provide: ProducerService, useValue: {} },
				{ provide: ConsumerService, useValue: {} },
				{ provide: TagService, useValue: {} },
				{ provide: PlaylistService, useValue: {} },
				{ provide: VideoSearchService, useValue: { search } },
			],
		}).compile();
		service = moduleRef.get(VideoService);
	});

	it('passes offset and limit from the dto to the query', async () => {
		await service.search(dto({ offset: 20, limit: 5 }), user);

		expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ offset: 20, limit: 5 }));
	});

	it('returns an empty list without querying when no results match', async () => {
		search.mockResolvedValue([]);

		const result = await service.search(dto(), user);

		expect(result).toEqual([]);
		expect(findMany).not.toHaveBeenCalled();
	});

	it('returns an empty list when onlySubbed is set but the user has no subscriptions', async () => {
		selectFromWhereExecute.mockResolvedValue([]);

		const result = await service.search(dto({ onlySubbed: true }), user);

		expect(result).toEqual([]);
		expect(findMany).not.toHaveBeenCalled();
	});

	it('keeps returning hydrated videos on the happy path', async () => {
		const result = await service.search(dto(), user);

		expect(result).toEqual([{ id: 11 }, { id: 22 }]);
	});
});
