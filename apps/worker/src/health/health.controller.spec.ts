import { Test } from '@nestjs/testing';
import { ConsumerService } from '../queue/consumer.service';
import { DeadLetterService } from '../queue/dead-letter.service';
import { MinioClientService } from '../minio-client/minio-client.service';
import { VideoProcessService } from '../video/video-process.service';
import { VideoService } from '../video/video.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
	let controller: HealthController;
	let isConnected: vi.Mock;
	let isAvailable: vi.Mock;
	let deadLetterCount: vi.Mock;

	beforeEach(async () => {
		isConnected = vi.fn();
		isAvailable = vi.fn();
		deadLetterCount = vi.fn().mockResolvedValue(0);

		const moduleRef = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{ provide: ConsumerService, useValue: { isConnected } },
				{ provide: DeadLetterService, useValue: { count: deadLetterCount } },
				{ provide: MinioClientService, useValue: { isAvailable } },
				{ provide: VideoService, useValue: { activeJob: null } },
				{ provide: VideoProcessService, useValue: { activeEncoder: 'h264_vaapi' } },
			],
		}).compile();
		controller = moduleRef.get(HealthController);
	});

	it('liveness reports ok and uptime with zero external io', () => {
		const result = controller.liveness();

		expect(result.status).toBe('ok');
		expect(typeof result.uptime).toBe('number');
	});

	it('readiness reports rmq and storage down when dependencies are unavailable', async () => {
		isConnected.mockReturnValue(false);
		isAvailable.mockResolvedValue(false);

		const result = await controller.readiness();

		expect(result).toEqual({
			rmq: false,
			storage: false,
			deadLetters: 0,
			encoder: 'h264_vaapi',
			activeJob: null,
		});
	});

	it('readiness reports dependencies up and the active job', async () => {
		isConnected.mockReturnValue(true);
		isAvailable.mockResolvedValue(true);
		const activeJob = { videoId: 7, startedAt: '2026-09-07T00:00:00.000Z' };
		const moduleRef = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{ provide: ConsumerService, useValue: { isConnected } },
				{ provide: DeadLetterService, useValue: { count: deadLetterCount } },
				{ provide: MinioClientService, useValue: { isAvailable } },
				{ provide: VideoService, useValue: { activeJob } },
				{ provide: VideoProcessService, useValue: { activeEncoder: 'h264_vaapi' } },
			],
		}).compile();

		const result = await moduleRef.get(HealthController).readiness();

		expect(result).toEqual({
			rmq: true,
			storage: true,
			deadLetters: 0,
			encoder: 'h264_vaapi',
			activeJob,
		});
	});
});
