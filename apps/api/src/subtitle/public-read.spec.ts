import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { OptionalJwtAuthGuard } from '../common/guards';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { VideoService } from '../video/video.service';
import { SubtitleController } from './subtitle.controller';
import { SubtitleService } from './subtitle.service';

describe('SubtitleService public read gating', () => {
	let service: SubtitleService;
	let findFirst: ReturnType<typeof vi.fn>;
	let findMany: ReturnType<typeof vi.fn>;

	const video = (overrides: Record<string, unknown> = {}) =>
		({ id: 9, isReleased: false, channel: { ownerId: 1 }, ...overrides }) as any;

	beforeEach(async () => {
		findFirst = vi.fn().mockResolvedValue(video());
		findMany = vi.fn().mockResolvedValue([{ id: 11 }, { id: 22 }]);

		const moduleRef = await Test.createTestingModule({
			providers: [
				SubtitleService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { videos: { findFirst }, subtitles: { findMany } } },
					},
				},
				{ provide: FileService, useValue: {} },
				{ provide: VideoService, useValue: {} },
			],
		}).compile();
		service = moduleRef.get(SubtitleService);
	});

	describe('getSubtitlesByVideoId', () => {
		it('returns subtitles of a released video to anonymous callers', async () => {
			findFirst.mockResolvedValue(video({ isReleased: true }));

			const result = await service.getSubtitlesByVideoId(9, undefined);

			expect(result).toEqual([{ id: 11 }, { id: 22 }]);
		});

		it('hides an unreleased video from anonymous callers', async () => {
			await expect(service.getSubtitlesByVideoId(9, undefined)).rejects.toThrow(NotFoundException);
		});

		it('hides an unreleased video from another signed-in user', async () => {
			await expect(service.getSubtitlesByVideoId(9, { id: 2 } as any)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('returns subtitles of an unreleased video to its channel owner', async () => {
			const result = await service.getSubtitlesByVideoId(9, { id: 1 } as any);

			expect(result).toEqual([{ id: 11 }, { id: 22 }]);
		});

		it('reports a nonexistent video as NotFound', async () => {
			findFirst.mockResolvedValue(undefined);

			await expect(service.getSubtitlesByVideoId(404, undefined)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('keeps the response shape unchanged', async () => {
			findFirst.mockResolvedValue(video({ isReleased: true }));
			const rows = [{ id: 11 }, { id: 22 }];
			findMany.mockResolvedValue(rows);

			await expect(service.getSubtitlesByVideoId(9, undefined)).resolves.toBe(rows);
		});
	});

	describe('SubtitleController /by-video-id wiring', () => {
		const reflector = new Reflector();
		const subtitleServiceMock = {
			getSubtitlesByVideoId: vi.fn().mockResolvedValue([{ id: 11 }]),
		};
		const controller = new SubtitleController(subtitleServiceMock as any);

		it('serves /by-video-id publicly while still resolving the owner', () => {
			expect(reflector.get('isPublic', controller.getSubtitleByVideoId)).toBe(true);
			expect(reflector.get('__guards__', controller.getSubtitleByVideoId)).toContain(
				OptionalJwtAuthGuard,
			);
		});

		it('keeps the other subtitle routes behind the jwt guard', () => {
			expect(reflector.get('isPublic', controller.getSubtitleById)).toBeUndefined();
			expect(reflector.get('isPublic', controller.deleteSubtitle)).toBeUndefined();
		});

		it('passes the requesting user through to the service', async () => {
			const user = { id: 1 } as any;

			await controller.getSubtitleByVideoId({ videoId: 9 } as any, user);

			expect(subtitleServiceMock.getSubtitlesByVideoId).toHaveBeenCalledWith(9, user);
		});
	});
});
