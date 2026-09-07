import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { ProducerService } from '../queue/producer.service';
import { VideoService } from '../video/video.service';
import { LiveService } from './live.service';

describe('LiveService srsOnUnpublish', () => {
	let service: LiveService;
	let getLiveByVideoId: jest.Mock;
	let execute: jest.Mock;

	const dto = (stream: string) =>
		({
			app: 'live',
			stream,
			server_id: 's',
			service_id: 's',
			action: 'unpublish',
			client_id: '1',
			ip: '1.2.3.4',
			vhost: 'v',
			tcUrl: 'rtmp://x/live',
			param: '',
			stream_url: 'rtmp://x/live/' + stream,
			stream_id: '1',
		}) as any;

	beforeEach(async () => {
		getLiveByVideoId = jest.fn();
		execute = jest.fn().mockResolvedValue(undefined);

		const update = jest.fn().mockReturnValue({
			set: jest.fn().mockReturnValue({
				where: jest.fn().mockReturnValue({ execute }),
			}),
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				LiveService,
				{ provide: ConfigService, useValue: {} },
				{ provide: VideoService, useValue: { getLiveByVideoId } },
				{
					provide: DrizzleService,
					useValue: { db: { query: { videos: { findFirst: jest.fn() } }, update } },
				},
				{ provide: ProducerService, useValue: { addToQueue: jest.fn() } },
			],
		}).compile();
		service = moduleRef.get(LiveService);
	});

	it('marks the live video inactive when the stream ends', async () => {
		getLiveByVideoId.mockResolvedValue({ id: 5, videoId: 'deadbeefdeadbeef' });

		const result = await service.srsOnUnpublish(dto('deadbeefdeadbeef'));

		expect(result).toEqual({ code: 0 });
		expect(execute).toHaveBeenCalledTimes(1);
	});

	it('throws NotFoundException for an unknown stream key', async () => {
		getLiveByVideoId.mockResolvedValue(undefined);

		await expect(service.srsOnUnpublish(dto('deadbeefdeadbeef'))).rejects.toThrow(
			NotFoundException,
		);
	});
});
