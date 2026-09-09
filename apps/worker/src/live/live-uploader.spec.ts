import { mkdtemp, mkdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { LiveUploader } from './live-uploader';

describe('LiveUploader', () => {
	let dir: string;
	let uploads: Array<{ bucket: string; key: string }>;
	let bodies: Array<{ bucket: string; key: string; body: string }>;
	let client: {
		fPutObject: (bucket: string, key: string, path: string) => Promise<void>;
		putObject: (bucket: string, key: string, body: Buffer) => Promise<void>;
	};
	let uploader: LiveUploader;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'live-uploader-'));
		uploads = [];
		bodies = [];
		client = {
			fPutObject: async (bucket: string, key: string) => {
				uploads.push({ bucket, key });
			},
			putObject: async (bucket: string, key: string, body: Buffer) => {
				bodies.push({ bucket, key, body: body.toString() });
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
		// no resume prefixes: everything goes through fPutObject, putObject unused
		expect(bodies).toHaveLength(0);
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

	it('splices a stored playlist prefix ahead of the local entries with one discontinuity', async () => {
		const stored = '#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6.0,\nsegment_360p_00001.ts\n';
		const local = '#EXTM3U\n#EXT-X-PLAYLIST-TYPE:EVENT\n#EXTINF:6.0,\nsegment_360p_00002.ts\n';
		await write('manifest_360p.m3u8', local);
		await write('segment_360p_00002.ts', 'seg');

		uploader = new LiveUploader(dir, '7', client, new Map([['manifest_360p.m3u8', stored]]));

		// two ticks: the segment becomes stable and goes through fPutObject
		await uploader.tick();
		await uploader.tick();

		// the playlist is spliced via putObject (every tick, like before);
		// segments still go through fPutObject
		expect(uploads.map((u) => u.key)).toEqual(['7/segment_360p_00002.ts']);
		expect(bodies).toHaveLength(2);
		expect(bodies[0]).toEqual({
			bucket: 'hls',
			key: '7/manifest_360p.m3u8',
			// local header (everything before the first #EXTINF) is stripped
			body: stored + '#EXT-X-DISCONTINUITY\n' + '#EXTINF:6.0,\nsegment_360p_00002.ts\n',
		});
		expect(bodies[0].body.match(/#EXT-X-DISCONTINUITY/g)).toHaveLength(1);
	});

	it('leaves the stored playlist untouched while the local one has no segments yet', async () => {
		await write('manifest_360p.m3u8', '#EXTM3U\n#EXT-X-PLAYLIST-TYPE:EVENT\n');

		uploader = new LiveUploader(dir, '7', client, new Map([['manifest_360p.m3u8', 'old']]));
		await uploader.tick();
		await uploader.flush();

		expect(uploads).toHaveLength(0);
		expect(bodies).toHaveLength(0);
	});
});
