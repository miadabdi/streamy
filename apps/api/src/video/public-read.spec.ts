import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PgDialect } from 'drizzle-orm/pg-core';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { OptionalJwtAuthGuard } from '../common/guards';
import { MinioClientService } from '../minio-client/minio-client.service';
import { PlaylistService } from '../playlist/playlist.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import VideoSearchService from '../search/video-search.service';
import { TagService } from '../tag/tags.service';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

const dialect = new PgDialect();

describe('VideoService public read gating', () => {
	let service: VideoService;
	let findMany: ReturnType<typeof vi.fn>;
	let findFirst: ReturnType<typeof vi.fn>;
	let search: ReturnType<typeof vi.fn>;
	let selectFromWhereExecute: ReturnType<typeof vi.fn>;

	const getVideosDto = (overrides: Record<string, unknown> = {}) =>
		({
			offset: 0,
			limit: 10,
			type: 'vod',
			onlySubbed: false,
			...overrides,
		}) as any;

	const searchDto = (overrides: Record<string, unknown> = {}) =>
		({
			text: 'anything',
			offset: 0,
			limit: 10,
			type: 'vod',
			onlySubbed: false,
			...overrides,
		}) as any;

	const video = (overrides: Record<string, unknown> = {}) =>
		({
			id: 9,
			isReleased: false,
			channel: { ownerId: 1 },
			...overrides,
		}) as any;

	beforeEach(async () => {
		findMany = vi.fn().mockResolvedValue([{ id: 11 }, { id: 22 }]);
		findFirst = vi.fn().mockResolvedValue(video());
		search = vi.fn().mockResolvedValue([{ id: 11 }, { id: 22 }]);
		selectFromWhereExecute = vi.fn().mockResolvedValue([]);

		const select = vi.fn().mockReturnValue({
			from: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({ execute: selectFromWhereExecute }),
			}),
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { videos: { findMany, findFirst } }, select },
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

	describe('getAllVideos', () => {
		it('returns released videos for anonymous callers', async () => {
			const result = await service.getAllVideos(getVideosDto(), undefined);

			expect(result).toEqual([{ id: 11 }, { id: 22 }]);
		});

		it('still filters isReleased for anonymous callers', async () => {
			await service.getAllVideos(getVideosDto(), undefined);

			const rendered = dialect.sqlToQuery(findMany.mock.calls[0][0].where);
			expect(rendered.sql).toContain('is_released');
			expect(rendered.params[0]).toBe(true);
		});

		it('rejects onlySubbed without a signed-in user', async () => {
			await expect(
				service.getAllVideos(getVideosDto({ onlySubbed: true }), undefined),
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('search', () => {
		it('returns released videos for anonymous callers', async () => {
			const result = await service.search(searchDto(), undefined);

			expect(result).toEqual([{ id: 11 }, { id: 22 }]);
		});

		it('still filters isReleased for anonymous callers', async () => {
			await service.search(searchDto(), undefined);

			const rendered = dialect.sqlToQuery(findMany.mock.calls[0][0].where);
			expect(rendered.sql).toContain('is_released');
			expect(rendered.params).toContain(true);
		});

		it('rejects onlySubbed without a signed-in user', async () => {
			await expect(service.search(searchDto({ onlySubbed: true }), undefined)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('getVideoById', () => {
		it('returns an unreleased video to its channel owner', async () => {
			const result = await service.getVideoById(9, { id: 1 } as any);

			expect(result).toEqual(video());
		});

		it('hides an unreleased video from another signed-in user', async () => {
			await expect(service.getVideoById(9, { id: 2 } as any)).rejects.toThrow(NotFoundException);
		});

		it('hides an unreleased video from anonymous callers', async () => {
			await expect(service.getVideoById(9, undefined)).rejects.toThrow(NotFoundException);
		});

		it('reports a nonexistent video as NotFound', async () => {
			findFirst.mockResolvedValue(undefined);

			await expect(service.getVideoById(404, undefined)).rejects.toThrow(NotFoundException);
		});

		it('returns a released video to anonymous callers', async () => {
			findFirst.mockResolvedValue(video({ isReleased: true }));

			const result = await service.getVideoById(9, undefined);

			expect(result).toEqual(video({ isReleased: true }));
		});

		it('returns a released video to signed-in non-owners', async () => {
			findFirst.mockResolvedValue(video({ isReleased: true }));

			const result = await service.getVideoById(9, { id: 2 } as any);

			expect(result).toEqual(video({ isReleased: true }));
		});
	});

	describe('getVideoByVideoId', () => {
		it('returns an unreleased video to its channel owner', async () => {
			const result = await service.getVideoByVideoId('vid', { id: 1 } as any);

			expect(result).toEqual(video());
		});

		it('hides an unreleased video from another signed-in user', async () => {
			await expect(service.getVideoByVideoId('vid', { id: 2 } as any)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('returns a released video to signed-in non-owners', async () => {
			findFirst.mockResolvedValue(video({ isReleased: true }));

			const result = await service.getVideoByVideoId('vid', { id: 2 } as any);

			expect(result).toEqual(video({ isReleased: true }));
		});
	});

	describe('VideoController /by-id and /by-video-id wiring', () => {
		const reflector = new Reflector();
		const videoServiceMock = {
			getVideoById: vi.fn().mockResolvedValue({ id: 9 }),
			getVideoByVideoId: vi.fn().mockResolvedValue({ id: 9 }),
		};
		const controller = new VideoController(videoServiceMock as any, {} as any);

		it('serves /by-id publicly while still resolving the owner', () => {
			expect(reflector.get('isPublic', controller.getVideoById)).toBe(true);
			expect(reflector.get('__guards__', controller.getVideoById)).toContain(OptionalJwtAuthGuard);
		});

		it('keeps /by-video-id behind the jwt guard', () => {
			expect(reflector.get('isPublic', controller.getVideoByVideoId)).toBeUndefined();
		});

		it('passes the requesting user through on both routes', async () => {
			const user = { id: 1 } as any;

			await controller.getVideoById({ id: 9 } as any, user);
			await controller.getVideoByVideoId({ videoId: 'vid' } as any, user);

			expect(videoServiceMock.getVideoById).toHaveBeenCalledWith(9, user);
			expect(videoServiceMock.getVideoByVideoId).toHaveBeenCalledWith('vid', user);
		});
	});
});
