import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { LiveUploader } from './live-uploader';

describe('LiveUploader', () => {
	let dir: string;
	let uploads: Array<{ bucket: string; key: string }>;
	let uploader: LiveUploader;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'live-uploader-'));
		uploads = [];
		const client = {
			fPutObject: async (bucket: string, key: string) => {
				uploads.push({ bucket, key });
			},
		};
		uploader = new LiveUploader(dir, '7', client);
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	const write = async (name: string, content: string) => writeFile(join(dir, name), content);

	it('uploads a segment only after its size is stable across ticks', async () => {
		await write('segment_360p_00001.ts', 'a'.repeat(100));

		await uploader.tick();
		expect(uploads).toHaveLength(0);

		await uploader.tick();
		expect(uploads).toHaveLength(1);
		expect(uploads[0]).toEqual({ bucket: 'hls', key: '7/segment_360p_00001.ts' });

		// already uploaded segments are not re-uploaded
		await uploader.tick();
		expect(uploads).toHaveLength(1);
	});

	it('does not upload a segment while it is still growing', async () => {
		await write('segment_360p_00001.ts', 'a'.repeat(100));
		await uploader.tick();

		await write('segment_360p_00001.ts', 'a'.repeat(200));
		await uploader.tick();

		expect(uploads).toHaveLength(0);
	});

	it('uploads manifests on every tick', async () => {
		await write('manifest_360p.m3u8', '#EXTM3U v1');
		await write('master.m3u8', '#EXTM3U master');

		await uploader.tick();
		await write('manifest_360p.m3u8', '#EXTM3U v1 v2');
		await uploader.tick();

		const manifestUploads = uploads.filter((u) => u.key.endsWith('.m3u8'));
		expect(manifestUploads).toHaveLength(4); // both playlists re-uploaded every tick
	});

	it('ignores files that are not hls output', async () => {
		await write('notes.txt', 'hello');
		await write('redundant_360p_0001.ts', 'x');

		await uploader.tick();
		await uploader.tick();
		await uploader.flush();

		expect(uploads).toHaveLength(0);
	});

	it('flush uploads everything remaining once ffmpeg exits', async () => {
		await write('segment_360p_00003.ts', 'final-segment');
		await write('manifest_360p.m3u8', '#EXTM3U final');

		await uploader.flush();

		expect(uploads.map((u) => u.key).sort()).toEqual([
			'7/manifest_360p.m3u8',
			'7/segment_360p_00003.ts',
		]);
	});
});
