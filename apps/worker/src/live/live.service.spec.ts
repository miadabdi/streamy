import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { MinioClientService } from '../minio-client/minio-client.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import { VideoProcessService } from '../video/video-process.service';
import { LiveService } from './live.service';
import { LiveUploader } from './live-uploader';

vi.mock('fs', () => ({ existsSync: vi.fn(), mkdirSync: vi.fn() }));
vi.mock('fs/promises', () => ({ readdir: vi.fn(), rm: vi.fn() }));
vi.mock('./live-uploader', () => ({
	// a regular function: an arrow implementation cannot be `new`ed
	LiveUploader: vi.fn().mockImplementation(function () {
		return { tick: vi.fn(), flush: vi.fn() };
	}),
}));

const playlistOf = (segments: number, variant: string) =>
	[
		'#EXTM3U',
		'#EXT-X-PLAYLIST-TYPE:EVENT',
		...Array.from({ length: segments }, (_, i) => [
			'#EXTINF:6.0,',
			`segment_${variant}_${String(i + 1).padStart(5, '0')}.ts`,
		]).flat(),
		'#EXT-X-ENDLIST',
		'',
	].join('\n');

describe('LiveService resume splice', () => {
	let service: LiveService;
	let processLiveVideo: ReturnType<typeof vi.fn>;
	const store = new Map<string, string>(); // object key -> playlist; absent = missing

	const getObject = vi.fn(async (_bucket: string, key: string) => {
		const content = store.get(key);
		if (content === undefined) throw new Error('NotFound');
		return Readable.from([content]);
	});

	const message = { id: 9, videoId: 'v9', app: 'live', streamKey: 'key' } as any;

	beforeEach(async () => {
		store.clear();
		getObject.mockClear();
		vi.mocked(LiveUploader).mockClear();
		processLiveVideo = vi.fn().mockResolvedValue(undefined);

		const moduleRef = await Test.createTestingModule({
			providers: [
				LiveService,
				{ provide: ConfigService, useValue: { get: vi.fn().mockReturnValue(undefined) } },
				{ provide: VideoProcessService, useValue: { processLiveVideo } },
				{ provide: MinioClientService, useValue: { client: { getObject } } },
				{ provide: ConsumerService, useValue: { pollOnQueue: vi.fn() } },
				{
					provide: ProducerService,
					useValue: { addToQueue: vi.fn().mockResolvedValue(undefined) },
				},
			],
		}).compile();
		service = moduleRef.get(LiveService);
	});

	it('derives startNumber as one past the fullest stored variant', async () => {
		store.set('9/manifest_1080p.m3u8', playlistOf(3, '1080p'));
		store.set('9/manifest_720p.m3u8', playlistOf(5, '720p'));
		store.set('9/manifest_360p.m3u8', playlistOf(2, '360p'));

		const { prefixes, startNumber } = await service['prepareResume'](9);

		expect(startNumber).toBe(6);
		expect([...prefixes.keys()].sort()).toEqual([
			'manifest_1080p.m3u8',
			'manifest_360p.m3u8',
			'manifest_720p.m3u8',
		]);
		for (const content of prefixes.values()) {
			// the previous leg's ENDLIST must not terminate the spliced playlist
			expect(content).not.toContain('#EXT-X-ENDLIST');
		}
	});

	it('falls back to a fresh leg when no variant produced anything', async () => {
		const { prefixes, startNumber } = await service['prepareResume'](9);

		expect(startNumber).toBe(1);
		expect(prefixes.size).toBe(0);
	});

	it('skips missing and segment-less variants but resumes off the rest', async () => {
		store.set('9/manifest_1080p.m3u8', playlistOf(4, '1080p'));
		store.set('9/manifest_360p.m3u8', playlistOf(0, '360p')); // manifest, zero segments

		const { prefixes, startNumber } = await service['prepareResume'](9);

		expect(startNumber).toBe(5);
		expect([...prefixes.keys()]).toEqual(['manifest_1080p.m3u8']);
	});

	it('threads resume prefixes into the uploader and the start number into ffmpeg', async () => {
		vi.useFakeTimers();
		try {
			store.set('9/manifest_720p.m3u8', playlistOf(5, '720p'));

			const job = service.runLiveJob({ ...message, resume: true });
			await vi.advanceTimersByTimeAsync(1000); // srs settle delay
			await job;

			const [dir, minioDir, _client, prefixes] = vi.mocked(LiveUploader).mock.calls[0];
			expect(minioDir).toBe('9');
			expect(prefixes.get('manifest_720p.m3u8')).toContain('segment_720p_00005.ts');
			expect(processLiveVideo).toHaveBeenCalledWith(expect.any(String), dir, 6);
		} finally {
			vi.useRealTimers();
		}
	});

	it('runs a fresh leg without prefixes or a start number', async () => {
		vi.useFakeTimers();
		try {
			const job = service.runLiveJob(message);
			await vi.advanceTimersByTimeAsync(1000);
			await job;

			const [, , , prefixes] = vi.mocked(LiveUploader).mock.calls[0];
			expect(prefixes).toBeUndefined();
			expect(processLiveVideo).toHaveBeenCalledWith(expect.any(String), expect.any(String), 1);
		} finally {
			vi.useRealTimers();
		}
	});
});
