import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PgDialect } from 'drizzle-orm/pg-core';
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

const dialect = new PgDialect();
const GRACE = 300;

describe('VideoService live state', () => {
	let service: VideoService;
	let findFirst: ReturnType<typeof vi.fn>;

	const liveRow = (overrides: Record<string, unknown> = {}) =>
		({
			id: 9,
			videoId: 'deadbeefdeadbeef',
			type: 'live',
			isActive: true,
			isReleased: true,
			liveStartedAt: new Date('2026-09-09T10:00:00Z'),
			disconnectedAt: null,
			channel: { ownerId: 1 },
			...overrides,
		}) as any;

	beforeEach(async () => {
		findFirst = vi.fn();

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: ConfigService,
					useValue: { get: vi.fn().mockReturnValue(GRACE) },
				},
				{
					provide: DrizzleService,
					useValue: { db: { query: { videos: { findFirst } } } },
				},
				{ provide: MinioClientService, useValue: {} },
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

	describe('getLiveByVideoId lookup', () => {
		it('matches inactive rows only while inside the grace window', async () => {
			findFirst.mockResolvedValue(liveRow());

			await service.getLiveByVideoId('deadbeefdeadbeef');

			const rendered = dialect.sqlToQuery(findFirst.mock.calls[0][0].where);
			expect(rendered.sql).toContain('is_active');
			expect(rendered.sql).toContain('disconnected_at');
			expect(rendered.sql).toContain('make_interval');
			expect(rendered.params).toContain(GRACE);
		});

		it('returns undefined when no row matches', async () => {
			findFirst.mockResolvedValue(undefined);

			await expect(service.getLiveByVideoId('deadbeefdeadbeef')).resolves.toBeUndefined();
		});

		it('labels an active broadcast live and exposes ISO timestamps', async () => {
			findFirst.mockResolvedValue(liveRow());

			const result = (await service.getLiveByVideoId('deadbeefdeadbeef')) as any;

			expect(result.liveState).toBe('live');
			expect(result.liveStartedAt).toBe('2026-09-09T10:00:00.000Z');
			expect(result.disconnectedAt).toBeNull();
		});

		it('labels a recent disconnect reconnecting', async () => {
			findFirst.mockResolvedValue(
				liveRow({ isActive: false, disconnectedAt: new Date(Date.now() - 10_000) }),
			);

			const result = (await service.getLiveByVideoId('deadbeefdeadbeef')) as any;

			expect(result.liveState).toBe('reconnecting');
		});
	});

	describe('getVideoById liveState', () => {
		it('labels a disconnect inside the grace window reconnecting', async () => {
			findFirst.mockResolvedValue(
				liveRow({ isActive: false, disconnectedAt: new Date(Date.now() - 10_000) }),
			);

			const result = (await service.getVideoById(9, undefined)) as any;

			expect(result.liveState).toBe('reconnecting');
		});

		it('labels a disconnect outside the grace window ended', async () => {
			findFirst.mockResolvedValue(
				liveRow({
					isActive: false,
					disconnectedAt: new Date(Date.now() - (GRACE + 60) * 1000),
				}),
			);

			const result = (await service.getVideoById(9, undefined)) as any;

			expect(result.liveState).toBe('ended');
		});

		it('labels an inactive row with no disconnect timestamp ended', async () => {
			findFirst.mockResolvedValue(liveRow({ isActive: false }));

			const result = (await service.getVideoById(9, undefined)) as any;

			expect(result.liveState).toBe('ended');
		});

		it('leaves vod payloads untouched', async () => {
			const vod = liveRow({ type: 'vod' });
			findFirst.mockResolvedValue(vod);

			const result = (await service.getVideoById(9, undefined)) as any;

			expect(result).toEqual(vod);
			expect(result).not.toHaveProperty('liveState');
		});
	});
});
