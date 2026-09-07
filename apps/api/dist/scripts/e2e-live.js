'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const child_process_1 = require('child_process');
const crypto_1 = require('crypto');
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const VIDEO_PATH = process.env.E2E_VIDEO_PATH ?? '/home/miad/Videos/untitled.mp4';
const S3_PUBLIC = process.env.E2E_S3_PUBLIC ?? 'http://localhost:9002';
const RTMP_URL = process.env.E2E_RTMP_URL ?? 'rtmp://localhost:1935/live';
const FFMPEG = process.env.E2E_FFMPEG ?? 'ffmpeg';
const EMAIL =
	process.env.E2E_EMAIL ?? `e2e-live-${(0, crypto_1.randomBytes)(4).toString('hex')}@streamy.test`;
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2ePassword123';
const PUSH_SECONDS = 45;
const API = `${BASE_URL}/api/v1`;
let cookie = '';
let passed = 0;
function ok(step) {
	passed++;
	console.log(`  PASS ${step}`);
}
async function call(method, path, body) {
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
async function expectStatus(step, res, status) {
	if (res.status !== status) {
		throw new Error(
			`FAIL ${step}: expected ${status}, got ${res.status}: ${(await res.text()).slice(0, 300)}`,
		);
	}
	ok(step);
	return res;
}
const segmentCount = async (url) => {
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
		} catch {}
		if (i === 59) throw new Error('API not reachable (is the stack up?)');
		await new Promise((r) => setTimeout(r, 2000));
	}
	let res = await call('POST', '/auth/signin', { email: EMAIL, password: PASSWORD });
	if (res.status === 429) throw new Error('auth throttle hit — wait 10 minutes');
	if (!cookie) {
		const username = `e2elive${(0, crypto_1.randomBytes)(3).toString('hex')}`;
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
	const me = await (await call('GET', '/user/me')).json();
	const channelId = me.channels[0].id;
	const videoRes = await expectStatus(
		'create live video',
		await call('POST', '/video', {
			name: `e2e live ${(0, crypto_1.randomBytes)(2).toString('hex')}`,
			description: 'e2e live pipeline test',
			channelId,
			type: 'live',
			tagIds: [],
		}),
		201,
	);
	const video = await videoRes.json();
	const manifestUrl = `${S3_PUBLIC}/hls/${video.id}/manifest_360p.m3u8`;
	const masterUrl = `${S3_PUBLIC}/hls/${video.id}/master.m3u8`;
	console.log(`4. pushing rtmp stream for ${PUSH_SECONDS}s`);
	const pusher = (0, child_process_1.spawn)(
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
	const pushDone = new Promise((resolve) => pusher.on('close', () => resolve()));
	console.log('5. watching the public hls url during the broadcast');
	const deadline = Date.now() + (PUSH_SECONDS + 30) * 1000;
	let observed = [];
	while (Date.now() < deadline) {
		const status = await (await call('GET', `/video/by-id?id=${video.id}`)).json();
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
	console.log('6. waiting for stream end + final flush');
	let status;
	const endDeadline = Date.now() + 8 * 60 * 1000;
	while (Date.now() < endDeadline) {
		status = await (await call('GET', `/video/by-id?id=${video.id}`)).json();
		if (status.processingStatus === 'done') break;
		if (status.processingStatus === 'failed_in_processing') {
			throw new Error(`live processing failed:\n${status.ffmpegProcessLogs}`);
		}
		await new Promise((r) => setTimeout(r, 5000));
	}
	if (status.processingStatus !== 'done') throw new Error('timed out waiting for done');
	ok('stream ended, final flush, status done');
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
//# sourceMappingURL=e2e-live.js.map
