import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { ProducerService } from '../queue/producer.service';
import { VideoService } from '../video/video.service';
import { LiveService } from './live.service';

describe('LiveService srsOnPublish', () => {
	let service: LiveService;
	let getLiveByVideoId: ReturnType<typeof vi.fn>;
	let addToQueue: ReturnType<typeof vi.fn>;
	let setCalls: Array<Record<string, unknown>>;
	let resumeExecute: ReturnType<typeof vi.fn>;

	const publishDto = (stream: string) =>
		({
			app: 'live',
			stream,
			server_id: 's',
			service_id: 's',
			action: 'publish',
			client_id: '1',
			ip: '1.2.3.4',
			vhost: 'v',
			tcUrl: 'rtmp://x/live',
			param: '',
			stream_url: 'rtmp://x/live/' + stream,
			stream_id: '1',
		}) as any;

	const liveRow = (overrides: Record<string, unknown> = {}) =>
		({
			id: 5,
			videoId: 'deadbeefdeadbeef',
			processingStatus: 'ready_for_processing',
			liveStartedAt: null,
			isActive: true,
			...overrides,
		}) as any;

	beforeEach(async () => {
		getLiveByVideoId = vi.fn();
		addToQueue = vi.fn().mockResolvedValue(undefined);
		setCalls = [];
		resumeExecute = vi.fn().mockResolvedValue([{ id: 5 }]);

		const update = vi.fn().mockImplementation(() => ({
			set: vi.fn().mockImplementation((setArg: Record<string, unknown>) => {
				setCalls.push(setArg);
				return {
					where: vi.fn().mockReturnValue({
						execute: vi.fn().mockResolvedValue(undefined),
						returning: vi.fn().mockReturnValue({ execute: resumeExecute }),
					}),
				};
			}),
		}));

		const moduleRef = await Test.createTestingModule({
			providers: [
				LiveService,
				{ provide: ConfigService, useValue: {} },
				{
					provide: VideoService,
					useValue: {
						getLiveByVideoId,
						liveResumeGraceSeconds: vi.fn().mockReturnValue(300),
					},
				},
				{ provide: DrizzleService, useValue: { db: { update } } },
				{ provide: ProducerService, useValue: { addToQueue } },
			],
		}).compile();
		service = moduleRef.get(LiveService);
	});

	it('throws NotFoundException for an unknown or out-of-grace stream key', async () => {
		getLiveByVideoId.mockResolvedValue(undefined);

		await expect(service.srsOnPublish(publishDto('deadbeefdeadbeef'))).rejects.toThrow(
			NotFoundException,
		);
	});

	it('enqueues a fresh key, flips it to processing and stamps liveStartedAt', async () => {
		getLiveByVideoId.mockResolvedValue(liveRow());

		const result = await service.srsOnPublish(publishDto('deadbeefdeadbeef'));

		expect(result).toEqual({ code: 0 });
		expect(addToQueue).toHaveBeenCalledTimes(1);
		expect(addToQueue).toHaveBeenCalledWith('q.live.process', {
			id: 5,
			videoId: 'deadbeefdeadbeef',
			app: 'live',
			streamKey: 'deadbeefdeadbeef',
		});
		expect(setCalls[0]).toEqual({
			processingStatus: 'processing',
			liveStartedAt: expect.any(Date),
			isActive: true,
			disconnectedAt: null,
		});
	});

	it('does not overwrite an existing liveStartedAt', async () => {
		getLiveByVideoId.mockResolvedValue(
			liveRow({ liveStartedAt: new Date('2026-09-09T10:00:00Z') }),
		);

		await service.srsOnPublish(publishDto('deadbeefdeadbeef'));

		expect(setCalls[0]).not.toHaveProperty('liveStartedAt');
	});

	it('restores a processing key without enqueuing a second job', async () => {
		getLiveByVideoId.mockResolvedValue(
			liveRow({ processingStatus: 'processing', isActive: false }),
		);

		const result = await service.srsOnPublish(publishDto('deadbeefdeadbeef'));

		expect(result).toEqual({ code: 0 });
		expect(addToQueue).not.toHaveBeenCalled();
		expect(setCalls[0]).toEqual({ isActive: true, disconnectedAt: null });
	});

	it('resumes a done key inside the grace window with resume: true', async () => {
		getLiveByVideoId.mockResolvedValue(liveRow({ processingStatus: 'done', isActive: false }));

		const result = await service.srsOnPublish(publishDto('deadbeefdeadbeef'));

		expect(result).toEqual({ code: 0 });
		expect(resumeExecute).toHaveBeenCalledTimes(1);
		expect(setCalls[0]).toEqual({
			processingStatus: 'processing',
			isActive: true,
			disconnectedAt: null,
		});
		expect(addToQueue).toHaveBeenCalledTimes(1);
		expect(addToQueue).toHaveBeenCalledWith('q.live.process', {
			id: 5,
			videoId: 'deadbeefdeadbeef',
			app: 'live',
			streamKey: 'deadbeefdeadbeef',
			resume: true,
		});
	});

	it('skips the enqueue when a racing publish already resumed the key', async () => {
		getLiveByVideoId.mockResolvedValue(
			liveRow({ processingStatus: 'failed_in_processing', isActive: false }),
		);
		resumeExecute.mockResolvedValue([]);

		const result = await service.srsOnPublish(publishDto('deadbeefdeadbeef'));

		expect(result).toEqual({ code: 0 });
		expect(addToQueue).not.toHaveBeenCalled();
	});

	it('rejects a key in a non-publishable state', async () => {
		getLiveByVideoId.mockResolvedValue(liveRow({ processingStatus: 'waiting_in_queue' }));

		await expect(service.srsOnPublish(publishDto('deadbeefdeadbeef'))).rejects.toThrow(
			BadRequestException,
		);
		expect(addToQueue).not.toHaveBeenCalled();
	});
});
