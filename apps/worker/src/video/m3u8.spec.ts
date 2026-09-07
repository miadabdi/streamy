import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { VideoService } from './video.service';

describe('m3u8 surgery', () => {
	let dir: string;
	let service: VideoService;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'm3u8-'));
		service = new VideoService({} as any, {} as any, {} as any, {} as any);
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	const MASTER = [
		'#EXTM3U',
		'#EXT-X-VERSION:6',
		'#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1920x1080,CODECS="avc1",NAME="1080p"',
		'manifest_1080p.m3u8',
		'#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1",NAME="360p"',
		'manifest_360p.m3u8',
		'',
	].join('\n');

	const SUB_PLAYLIST = [
		'#EXTM3U',
		'#EXT-X-VERSION:3',
		'#EXT-X-TARGETDURATION:6',
		'#EXTINF:6.0,',
		'sub_vtt_en.vtt',
		'#EXTINF:6.0,',
		'sub_vtt_en.vtt',
		'#EXT-X-ENDLIST',
		'#EXT-X-ENDLIST', // the redundant trailing block the surgery must strip
	].join('\n');

	it('correctSubM3U8 strips everything after the first ENDLIST', async () => {
		await writeFile(join(dir, 'sub_vtt_en.m3u8'), SUB_PLAYLIST, 'utf8');

		await service.correctSubM3U8(dir, 'sub_vtt_en.m3u8');

		const fixed = await readFile(join(dir, 'sub_vtt_en.m3u8'), 'utf8');
		expect(fixed.match(/#EXT-X-ENDLIST/g)).toHaveLength(1);
		expect(fixed.trim().endsWith('#EXT-X-ENDLIST')).toBe(true);
	});

	it('addSubToMaster injects the subtitle media group into every variant', async () => {
		await writeFile(join(dir, 'master.m3u8'), MASTER, 'utf8');
		await writeFile(join(dir, 'sub_vtt_en.m3u8'), SUB_PLAYLIST, 'utf8');

		await service.addSubToMaster(
			dir,
			{
				id: 1,
				langRFC5646: 'en',
				fileId: 2,
				filePath: 'en.srt',
				bucketName: 'subtitlefiles',
				sizeInByte: 10,
				mimetype: 'text/plain',
			},
			'sub_vtt_en.m3u8',
		);

		const master = await readFile(join(dir, 'master.m3u8'), 'utf8');
		expect(master).toContain('#EXT-X-MEDIA:TYPE=SUBTITLES');
		expect(master).toContain('sub_vtt_en.m3u8');
		// every variant references the subtitle group
		const variantLines = master.split('\n').filter((l) => l.startsWith('#EXT-X-STREAM-INF'));
		expect(variantLines).toHaveLength(2);
		for (const line of variantLines) {
			expect(line).toContain('SUBTITLES="subtitles"');
		}
	});
});
