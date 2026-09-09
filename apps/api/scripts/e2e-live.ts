/**
 * Live pipeline end-to-end test, two acts on one stack:
 *
 * act one — basic live: signin -> create live video -> push a real rtmp
 * stream (ffmpeg -re) through srs -> on_publish hooks queue the worker ->
 * assert hls segments APPEAR and GROW on the public url WHILE the broadcast
 * runs -> push ends -> on_unpublish marks the stream inactive -> final
 * flush -> done status -> replay fetchable.
 *
 * act two — drop and resume: fresh live video -> SIGKILL the pusher
 * mid-stream (encoder drop) -> after the grace window kicks in the video
 * reads liveState=reconnecting with leg 1 flushed to done -> push again on
 * the same key -> the worker resumes with continued segment numbering and
 * splices a single #EXT-X-DISCONTINUITY into the stored playlist -> final
 * replay is whole.
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
const PUSH_SECONDS = 20;
// act two: leg 1 pushes with a loose bound and is SIGKILLed mid-stream once
// its first segment is publicly visible, then we wait out ffmpeg's 30s
// rw_timeout so the worker has certainly flushed the leg before asserting
const LEG1_PUSH_SECONDS = 60;
const DROP_GAP_SECONDS = 40;

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

const fetchText = async (url: string): Promise<string> => {
	const res = await fetch(url);
	if (res.status !== 200) throw new Error(`GET ${url} -> ${res.status}`);
	return res.text();
};

const maxSegmentIndex = (manifest: string): number => {
	const indices = [...manifest.matchAll(/segment_360p_(\d+)\.ts/g)].map((m) => Number(m[1]));
	return indices.length ? Math.max(...indices) : -1;
};

/**
 * pushes `seconds` of the test video at realtime pace. the source is hevc;
 * stock srs 6 only relays h264 video, so the push transcodes to h264 on the
 * fly — real broadcasters send h264 anyway
 */
const spawnPusher = (streamKey: string, seconds: number) =>
	spawn(
		FFMPEG,
		[
			'-hide_banner',
			'-loglevel',
			'error',
			'-re',
			'-t',
			String(seconds),
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
			`${RTMP_URL}/${streamKey}`,
		],
		{ stdio: ['ignore', 'inherit', 'inherit'] },
	);

/**
 * polls by-id until processing hits done (the encode tail can run several
 * minutes behind realtime on shared hardware); fails fast on a failure
 */
async function waitForDone(id: number, timeoutMs: number): Promise<any> {
	const deadline = Date.now() + timeoutMs;
	let status: any;
	while (Date.now() < deadline) {
		status = (await (await call('GET', `/video/by-id?id=${id}`)).json()) as any;
		if (status.processingStatus === 'done') return status;
		if (status.processingStatus === 'failed_in_processing') {
			throw new Error(`live processing failed:\n${status.ffmpegProcessLogs}`);
		}
		await new Promise((r) => setTimeout(r, 5000));
	}
	throw new Error(`timed out waiting for done (last: ${status?.processingStatus})`);
}

async function main() {
	console.log(`E2E LIVE against ${API}, pushing ${PUSH_SECONDS}s legs of ${VIDEO_PATH}`);

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

	// ---------- act one: a clean broadcast ----------
	console.log(`4. pushing rtmp stream for ${PUSH_SECONDS}s`);
	const pusher = spawnPusher(video.videoId, PUSH_SECONDS);
	const pushDone = new Promise<void>((resolve) => pusher.on('close', () => resolve()));

	// 5. while the broadcast runs: manifest appears and segment count grows.
	// the encode tail runs minutes behind realtime on shared hardware, so
	// the window stretches well past the push itself
	console.log('5. watching the public hls url during the broadcast');
	const deadline = Date.now() + (PUSH_SECONDS + 130) * 1000;
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

	// 6. wait for unpublish + final flush + done
	console.log('6. waiting for stream end + final flush');
	const final = await waitForDone(video.id, 8 * 60 * 1000);
	ok('stream ended, final flush, status done');

	// 7. replay fetchable + stream marked inactive
	if (final.isActive !== false) throw new Error(`isActive should be false after unpublish`);
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

	// ---------- act two: encoder drop, then resume on the same key ----------
	console.log('8. drop/resume: create a second live video');
	const video2Res = await expectStatus(
		'create live video (drop scenario)',
		await call('POST', '/video', {
			name: `e2e live resume ${randomBytes(2).toString('hex')}`,
			description: 'e2e live drop and resume test',
			channelId,
			type: 'live',
			tagIds: [],
		}),
		201,
	);
	const video2 = (await video2Res.json()) as any;
	const manifestUrl2 = `${S3_PUBLIC}/hls/${video2.id}/manifest_360p.m3u8`;
	const masterUrl2 = `${S3_PUBLIC}/hls/${video2.id}/master.m3u8`;

	// 9. leg 1: push, then SIGKILL the pusher mid-stream — a dropped encoder,
	// not a clean end; srs still fires on_unpublish. the kill lands shortly
	// after on_publish is observed: enough frames for a first segment (the
	// worker flushes whatever it buffered once the pull ends) while keeping
	// the leg short enough that its encode tail stays well inside the grace
	// window before leg 2 reconnects
	console.log(`9. pushing leg 1 (bound ${LEG1_PUSH_SECONDS}s), SIGKILL mid-stream`);
	const dropped = spawnPusher(video2.videoId, LEG1_PUSH_SECONDS);
	const leg1Live = Date.now() + 2 * 60 * 1000;
	let leg1Started = false;
	while (Date.now() < leg1Live) {
		const st = (await (await call('GET', `/video/by-id?id=${video2.id}`)).json()) as any;
		if (st.processingStatus === 'failed_in_processing') {
			throw new Error(`leg 1 failed:\n${st.ffmpegProcessLogs}`);
		}
		if (st.processingStatus === 'processing') {
			leg1Started = true;
			break;
		}
		await new Promise((r) => setTimeout(r, 3000));
	}
	if (!leg1Started) throw new Error('leg 1 never started (on_publish not observed)');
	await new Promise((r) => setTimeout(r, 12 * 1000));
	dropped.kill('SIGKILL');
	console.log('    pusher killed mid-stream');

	// 10. past ffmpeg's 30s rw_timeout the leg must have flushed (done) with
	// the disconnect still inside the 300s grace window (reconnecting)
	console.log(`10. waiting ${DROP_GAP_SECONDS}s out the rw_timeout, then polling by-id`);
	await new Promise((r) => setTimeout(r, DROP_GAP_SECONDS * 1000));
	const dropDeadline = Date.now() + 4 * 60 * 1000;
	let leg1Status: any;
	while (Date.now() < dropDeadline) {
		leg1Status = (await (await call('GET', `/video/by-id?id=${video2.id}`)).json()) as any;
		if (leg1Status.processingStatus === 'failed_in_processing') {
			throw new Error(`leg 1 failed after the drop:\n${leg1Status.ffmpegProcessLogs}`);
		}
		if (leg1Status.liveState === 'reconnecting' && leg1Status.processingStatus === 'done') break;
		await new Promise((r) => setTimeout(r, 3000));
	}
	if (leg1Status?.liveState !== 'reconnecting' || leg1Status?.processingStatus !== 'done') {
		throw new Error(
			`after the drop: liveState=${leg1Status?.liveState}, processingStatus=${leg1Status?.processingStatus} — expected reconnecting + done`,
		);
	}
	ok('drop detected (reconnecting within grace)');

	// 11. leg 1's last segment — leg 2 must continue past it
	const leg1Max = maxSegmentIndex(await fetchText(manifestUrl2));
	if (leg1Max < 0) throw new Error('leg 1 produced no 360p segments');
	console.log(`    leg 1 max segment index: ${leg1Max}`);

	// 12. leg 2: same key, let it end naturally
	console.log(`12. pushing leg 2 for ${PUSH_SECONDS}s on the same key`);
	const resumed = spawnPusher(video2.videoId, PUSH_SECONDS);
	await new Promise<void>((resolve) => resumed.on('close', () => resolve()));
	ok('resume push completed');

	// 13. final flush, then the playlist must carry exactly one discontinuity
	// where the legs were spliced and keep counting segments upward
	console.log('13. waiting for the resumed stream to finish');
	const final2 = await waitForDone(video2.id, 8 * 60 * 1000);
	ok('resumed stream ended, final flush, status done');
	if (final2.isActive !== false) throw new Error('isActive should be false after leg 2');

	const spliced = await fetchText(manifestUrl2);
	const discontinuities = (spliced.match(/#EXT-X-DISCONTINUITY/g) ?? []).length;
	if (discontinuities !== 1) {
		throw new Error(
			`expected exactly 1 discontinuity in the spliced playlist, got ${discontinuities}`,
		);
	}
	ok('resume spliced with discontinuity');

	const final2Max = maxSegmentIndex(spliced);
	if (final2Max <= leg1Max) {
		throw new Error(`segment numbering did not continue: ${final2Max} <= leg-1 max ${leg1Max}`);
	}
	ok(`segment numbering continued (${leg1Max} -> ${final2Max})`);

	const master2 = await fetch(masterUrl2);
	if (master2.status !== 200 || !(await master2.text()).includes('#EXTM3U')) {
		throw new Error(`resumed master.m3u8 not fetchable (${master2.status})`);
	}
	ok('resumed replay fetchable (master.m3u8)');

	console.log(`\nE2E LIVE PASSED (${passed} checks)`);
}

main().catch((err) => {
	console.error(`\nE2E LIVE FAILED after ${passed} checks`);
	console.error(err);
	process.exit(1);
});
