/**
 * Live pipeline end-to-end test: signin -> create live video -> push a real
 * RTMP stream (ffmpeg -re, 30s slice of the test video) through SRS ->
 * on_publish hooks queue the worker -> assert hls segments APPEAR and GROW
 * on the public url WHILE the broadcast is running -> push ends ->
 * on_unpublish marks the stream inactive -> final flush -> done status ->
 * replay fetchable.
 *
 * Usage: npm run test:e2e:live   (requires the full stack incl. srs up)
 * Config: E2E_BASE_URL, E2E_VIDEO_PATH, E2E_S3_PUBLIC, E2E_RTMP_URL,
 *         E2E_EMAIL / E2E_PASSWORD (defaults like e2e-vod)
 */

import { spawn } from 'child_process';
import { randomBytes } from 'crypto';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const VIDEO_PATH = process.env.E2E_VIDEO_PATH ?? '/home/miad/Videos/untitled.mp4';
const S3_PUBLIC = process.env.E2E_S3_PUBLIC ?? 'http://localhost:9002';
const RTMP_URL = process.env.E2E_RTMP_URL ?? 'rtmp://localhost:1935/live';
// the static binaries/ffmpeg 6.0.1 segfaults on rtmp push; use distro ffmpeg
const FFMPEG = process.env.E2E_FFMPEG ?? 'ffmpeg';
const EMAIL = process.env.E2E_EMAIL ?? `e2e-live-${randomBytes(4).toString('hex')}@streamy.test`;
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2ePassword123';
const PUSH_SECONDS = 45;

const API = `${BASE_URL}/api/v1`;
let cookie = '';
let passed = 0;

function ok(step: string) {
	passed++;
	console.log(`  PASS ${step}`);
}

async function call(method: string, path: string, body?: object) {
	const res = await fetch(`${API}${path}`, {
		method,
		headers: {
			...(body && { 'Content-Type': 'application/json' }),
			...(cookie && { Cookie: cookie }),
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const token = (res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith('access_token='));
	if (token) cookie = token.split(';')[0];
	return res;
}

async function expectStatus(step: string, res: Response, status: number) {
	if (res.status !== status) {
		throw new Error(
			`FAIL ${step}: expected ${status}, got ${res.status}: ${(await res.text()).slice(0, 300)}`,
		);
	}
	ok(step);
	return res;
}

const segmentCount = async (url: string): Promise<number> => {
	const res = await fetch(url);
	if (res.status !== 200) return -1;
	const body = await res.text();
	return (body.match(/segment_360p_\d+\.ts/g) ?? []).length;
};

async function main() {
	console.log(`E2E LIVE against ${API}, pushing ${PUSH_SECONDS}s of ${VIDEO_PATH}`);

	for (let i = 0; i < 60; i++) {
		try {
			if ((await fetch(`${BASE_URL}/api`)).status === 200) break;
		} catch {
			/* app restarting */
		}
		if (i === 59) throw new Error('API not reachable (is the stack up?)');
		await new Promise((r) => setTimeout(r, 2000));
	}

	// 1. auth
	let res = await call('POST', '/auth/signin', { email: EMAIL, password: PASSWORD });
	if (res.status === 429) throw new Error('auth throttle hit — wait 10 minutes');
	if (!cookie) {
		const username = `e2elive${randomBytes(3).toString('hex')}`;
		await expectStatus(
			'signup',
			await call('POST', '/auth/signup', {
				email: EMAIL,
				password: PASSWORD,
				channel: {
					username,
					name: 'E2E Live Channel',
					description: 'channel created by the e2e live script',
				},
			}),
			201,
		);
		await expectStatus(
			'signin',
			await call('POST', '/auth/signin', { email: EMAIL, password: PASSWORD }),
			200,
		);
	}

	// 2. channel
	const me = (await (await call('GET', '/user/me')).json()) as any;
	const channelId = me.channels[0].id;

	// 3. create live video (starts at ready_for_processing; stream key = videoId)
	const videoRes = await expectStatus(
		'create live video',
		await call('POST', '/video', {
			name: `e2e live ${randomBytes(2).toString('hex')}`,
			description: 'e2e live pipeline test',
			channelId,
			type: 'live',
			tagIds: [],
		}),
		201,
	);
	const video = (await videoRes.json()) as any;
	const manifestUrl = `${S3_PUBLIC}/hls/${video.id}/manifest_360p.m3u8`;
	const masterUrl = `${S3_PUBLIC}/hls/${video.id}/master.m3u8`;

	// 4. push rtmp for PUSH_SECONDS seconds (realtime pace).
	// the source is hevc; stock srs 6 only relays h264 video, so the push
	// transcodes to h264 on the fly — real broadcasters send h264 anyway
	console.log(`4. pushing rtmp stream for ${PUSH_SECONDS}s`);
	const pusher = spawn(
		FFMPEG,
		[
			'-hide_banner',
			'-loglevel',
			'error',
			'-re',
			'-t',
			String(PUSH_SECONDS),
			'-i',
			VIDEO_PATH,
			'-c:v',
			'libx264',
			'-preset',
			'veryfast',
			'-c:a',
			'copy',
			'-f',
			'flv',
			`${RTMP_URL}/${video.videoId}`,
		],
		{ stdio: ['ignore', 'inherit', 'inherit'] },
	);
	const pushDone = new Promise<void>((resolve) => pusher.on('close', () => resolve()));

	// 5. while the broadcast runs: manifest appears and segment count grows
	console.log('5. watching the public hls url during the broadcast');
	const deadline = Date.now() + (PUSH_SECONDS + 30) * 1000;
	let observed: number[] = [];
	while (Date.now() < deadline) {
		const status = (await (await call('GET', `/video/by-id?id=${video.id}`)).json()) as any;
		if (status.processingStatus === 'failed_in_processing') {
			throw new Error(`live processing failed:\n${status.ffmpegProcessLogs}`);
		}
		const count = await segmentCount(manifestUrl);
		if (count >= 0 && (observed.length === 0 || count > observed[observed.length - 1])) {
			observed.push(count);
			console.log(`    live segments visible: ${count} (status=${status.processingStatus})`);
		}
		if (observed.length >= 3) break;
		await new Promise((r) => setTimeout(r, 3000));
	}
	if (observed.length < 3) {
		throw new Error(`segments never grew during the broadcast (observed: ${observed.join(', ')})`);
	}
	ok('hls segments served while the broadcast is running');

	await pushDone;
	ok('rtmp push completed');

	// 6. wait for unpublish + final flush + done (the encode tail can run
	// several minutes behind realtime on shared hardware)
	console.log('6. waiting for stream end + final flush');
	let status: any;
	const endDeadline = Date.now() + 8 * 60 * 1000;
	while (Date.now() < endDeadline) {
		status = (await (await call('GET', `/video/by-id?id=${video.id}`)).json()) as any;
		if (status.processingStatus === 'done') break;
		if (status.processingStatus === 'failed_in_processing') {
			throw new Error(`live processing failed:\n${status.ffmpegProcessLogs}`);
		}
		await new Promise((r) => setTimeout(r, 5000));
	}
	if (status.processingStatus !== 'done') throw new Error('timed out waiting for done');
	ok('stream ended, final flush, status done');

	// 7. replay fetchable + stream marked inactive
	if (status.isActive !== false) throw new Error(`isActive should be false after unpublish`);
	ok('video marked inactive by on_unpublish');

	const master = await fetch(masterUrl);
	if (master.status !== 200 || !(await master.text()).includes('#EXTM3U')) {
		throw new Error(`replay master.m3u8 not fetchable (${master.status})`);
	}
	const finalCount = await segmentCount(manifestUrl);
	if (finalCount < observed[observed.length - 1]) {
		throw new Error(`replay lost segments: ${finalCount} < ${observed[observed.length - 1]}`);
	}
	ok(`replay fetchable with all segments (${finalCount})`);

	console.log(`\nE2E LIVE PASSED (${passed} checks)`);
}

main().catch((err) => {
	console.error(`\nE2E LIVE FAILED after ${passed} checks`);
	console.error(err);
	process.exit(1);
});
