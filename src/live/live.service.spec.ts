import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { ProducerService } from '../queue/producer.service';
import { VideoService } from '../video/video.service';
import { LiveService } from './live.service';

describe('LiveService srsOnPublish', () => {
	let service: LiveService;
	let getLiveByVideoId: ReturnType<typeof vi.fn>;

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

	beforeEach(async () => {
		getLiveByVideoId = vi.fn();

		const moduleRef = await Test.createTestingModule({
			providers: [
				LiveService,
				{ provide: ConfigService, useValue: {} },
				{ provide: VideoService, useValue: { getLiveByVideoId } },
				{
					provide: DrizzleService,
					useValue: { db: { query: { videos: { findFirst: vi.fn() } }, update: vi.fn() } },
				},
				{ provide: ProducerService, useValue: { addToQueue: vi.fn() } },
			],
		}).compile();
		service = moduleRef.get(LiveService);
	});

	it('throws NotFoundException for an unknown stream key', async () => {
		getLiveByVideoId.mockResolvedValue(undefined);

		await expect(service.srsOnPublish(publishDto('deadbeefdeadbeef'))).rejects.toThrow(
			NotFoundException,
		);
	});
});
