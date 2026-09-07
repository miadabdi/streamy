import { Test } from '@nestjs/testing';
import { MinioClientService } from '../minio-client/minio-client.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import { VideoProcessService } from './video-process.service';
import { VideoService } from './video.service';

vi.mock('fs/promises', () => ({
	readdir: vi.fn().mockResolvedValue(['master.m3u8', 'manifest_360p.m3u8', 'segment_360p.ts']),
	rm: vi.fn().mockResolvedValue(undefined),
	readFile: vi.fn().mockResolvedValue(''),
	writeFile: vi.fn().mockResolvedValue(undefined),
}));

const message = {
	videoId: 21,
	fileId: 9,
	bucketName: 'videos',
	filePath: 'x.mp4',
	sizeInByte: 100,
	mimetype: 'video/mp4',
	subs: [],
} as any;

describe('VideoService processVideoCallback', () => {
	let service: VideoService;
	let fGetObject: ReturnType<typeof vi.fn>;
	let processVideo: ReturnType<typeof vi.fn>;
	let moveFilesToMinio: ReturnType<typeof vi.fn>;
	let removeDirectory: ReturnType<typeof vi.fn>;
	let addToQueue: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		fGetObject = vi.fn().mockResolvedValue(undefined);
		processVideo = vi.fn().mockResolvedValue(undefined);
		moveFilesToMinio = vi.fn().mockResolvedValue(undefined);
		removeDirectory = vi.fn().mockResolvedValue(undefined);
		addToQueue = vi.fn().mockResolvedValue(undefined);

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{ provide: ConsumerService, useValue: { listenOnQueue: vi.fn() } },
				{ provide: MinioClientService, useValue: { client: { fGetObject, fPutObject: vi.fn() } } },
				{ provide: VideoProcessService, useValue: { processVideo } },
				{ provide: ProducerService, useValue: { addToQueue } },
			],
		}).compile();
		service = moduleRef.get(VideoService);

		// spy on the instance methods that touch disk layout
		vi.spyOn(service, 'moveFilesToMinio').mockImplementation(moveFilesToMinio);
		vi.spyOn(service, 'removeDirectory').mockImplementation(removeDirectory);
	});

	const statusMessages = () => addToQueue.mock.calls.map((c: any[]) => c[1].status);

	it('happy path: publishes processing then done, uploads and cleans up', async () => {
		await service.processVideoCallback(message);

		expect(processVideo).toHaveBeenCalledTimes(1);
		expect(moveFilesToMinio).toHaveBeenCalledTimes(1);
		expect(removeDirectory).toHaveBeenCalledTimes(1);
		expect(statusMessages()).toEqual(['processing', 'done']);
	});

	it('transcode failure publishes failed_in_processing with the ffmpeg logs', async () => {
		processVideo.mockRejectedValue({ code: 1, logs: 'boom frame=1' });

		await service.processVideoCallback(message);

		expect(statusMessages()).toEqual(['processing', 'failed_in_processing']);
		const failure = addToQueue.mock.calls[1][1];
		expect(failure.logs).toContain('boom');
		expect(moveFilesToMinio).not.toHaveBeenCalled();
	});

	it('reports the active job while processing', async () => {
		let resolveTranscode: () => void;
		processVideo.mockReturnValue(new Promise<void>((resolve) => (resolveTranscode = resolve)));

		const running = service.processVideoCallback(message);
		expect(service.activeJob?.videoId).toBe(21);

		resolveTranscode!();
		await running;
		expect(service.activeJob).toBeNull();
	});
});
