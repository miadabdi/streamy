import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { VideoService } from '../video/video.service';
import { SubtitleController } from './subtitle.controller';
import { SubtitleService } from './subtitle.service';

// Same shape as public-read.spec.ts: the real SubtitleService runs over a
// mocked drizzle, so the release gate comes from real code paths.
describe('SubtitleService getSubtitleById release gating', () => {
	let service: SubtitleService;
	let subtitlesFindFirst: ReturnType<typeof vi.fn>;

	const subtitle = (overrides: Record<string, unknown> = {}) =>
		({
			id: 11,
			video: { id: 9, isReleased: false, channel: { ownerId: 1 } },
			...overrides,
		}) as any;

	beforeEach(async () => {
		subtitlesFindFirst = vi.fn().mockResolvedValue(subtitle());

		const moduleRef = await Test.createTestingModule({
			providers: [
				SubtitleService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { subtitles: { findFirst: subtitlesFindFirst } } },
					},
				},
				{ provide: FileService, useValue: {} },
				{ provide: VideoService, useValue: {} },
			],
		}).compile();
		service = moduleRef.get(SubtitleService);
	});

	it("returns an unreleased video's subtitle to its channel owner", async () => {
		const row = subtitle();
		subtitlesFindFirst.mockResolvedValue(row);

		await expect(service.getSubtitleById(11, { id: 1 } as any)).resolves.toBe(row);
	});

	it("hides an unreleased video's subtitle from another signed-in user", async () => {
		await expect(service.getSubtitleById(11, { id: 2 } as any)).rejects.toThrow(NotFoundException);
	});

	it("returns a released video's subtitle to a non-owner", async () => {
		const row = subtitle({ video: { id: 9, isReleased: true, channel: { ownerId: 1 } } });
		subtitlesFindFirst.mockResolvedValue(row);

		await expect(service.getSubtitleById(11, { id: 2 } as any)).resolves.toBe(row);
	});

	it('reports a nonexistent subtitle as NotFound', async () => {
		subtitlesFindFirst.mockResolvedValue(undefined);

		await expect(service.getSubtitleById(404, { id: 1 } as any)).rejects.toThrow(NotFoundException);
	});

	it('keeps the response shape unchanged: the gate-only channel is not in the payload query', async () => {
		await service.getSubtitleById(11, { id: 1 } as any);

		expect(subtitlesFindFirst).toHaveBeenCalledTimes(2);
		expect(subtitlesFindFirst.mock.calls[0][0].with).toEqual({
			video: { with: { channel: true } },
		});
		expect(subtitlesFindFirst.mock.calls[1][0].with).toEqual({ video: true });
	});
});

describe('SubtitleController /by-id wiring', () => {
	const subtitleServiceMock = {
		getSubtitleById: vi.fn().mockResolvedValue({ id: 11 }),
	};
	const controller = new SubtitleController(subtitleServiceMock as any);

	it('passes the requesting user through to the service', async () => {
		const user = { id: 1 } as any;

		await controller.getSubtitleById({ id: 11 } as any, user);

		expect(subtitleServiceMock.getSubtitleById).toHaveBeenCalledWith(11, user);
	});
});
