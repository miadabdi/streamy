/**
 * VOD pipeline end-to-end test: signup/signin -> create video -> presigned
 * PUT untitled.mp4 -> confirm-upload -> process queue -> ffmpeg HLS transcode
 * -> release -> search, plus failure cases along the way.
 *
 * Usage: npm run test:e2e:vod
 * Config: E2E_BASE_URL (default http://localhost:3000)
 *         E2E_VIDEO_PATH (default /home/miad/Videos/untitled.mp4)
 *         E2E_S3_PUBLIC (default http://localhost:9002)
 *         E2E_EMAIL / E2E_PASSWORD (default random)
 */

import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const VIDEO_PATH = process.env.E2E_VIDEO_PATH ?? '/home/miad/Videos/untitled.mp4';
const S3_PUBLIC = process.env.E2E_S3_PUBLIC ?? 'http://localhost:9002';
const EMAIL = process.env.E2E_EMAIL ?? `e2e-${randomBytes(4).toString('hex')}@streamy.test`;
const PASSWORD = process.env.E2E_PASSWORD ?? 'e2ePassword123';

const API = `${BASE_URL}/api/v1`;
let cookie = '';
let passed = 0;

function ok(step: string) {
	passed++;
	console.log(`  PASS ${step}`);
}

async function call(
	method: string,
	path: string,
	{ body, raw, headers }: { body?: object; raw?: Buffer; headers?: Record<string, string> } = {},
) {
	const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
		method,
		headers: {
			...(body && { 'Content-Type': 'application/json' }),
			...(raw && { 'Content-Type': 'video/mp4' }),
			...(cookie && { Cookie: cookie }),
			...headers,
		},
		body: (raw ? new Uint8Array(raw) : body ? JSON.stringify(body) : undefined) as
			| BodyInit
			| undefined,
	});
	const setCookie = res.headers.getSetCookie?.() ?? [];
	const token = setCookie.find((c) => c.startsWith('access_token='));
	if (token) cookie = token.split(';')[0];
	return res;
}

async function expectStatus(step: string, res: Response, status: number) {
	if (res.status !== status) {
		const text = (await res.text()).slice(0, 500);
		throw new Error(`FAIL ${step}: expected ${status}, got ${res.status}: ${text}`);
	}
	ok(step);
	return res;
}

async function main() {
	console.log(`E2E VOD against ${API} with ${VIDEO_PATH}`);

	// the dev stack live-reloads on file changes; wait until it answers again
	for (let i = 0; i < 60; i++) {
		try {
			const probe = await fetch(`${BASE_URL}/api`);
			if (probe.status === 200) break;
		} catch {
			/* app restarting */
		}
		if (i === 59) throw new Error('API not reachable (is the stack up?)');
		await new Promise((r) => setTimeout(r, 2000));
	}

	// 1. auth (throttle: 10 auth requests / 10 min per IP)
	console.log('1. auth');
	let res = await call('POST', '/auth/signin', { body: { email: EMAIL, password: PASSWORD } });
	if (res.status === 429) throw new Error('auth throttle hit — wait 10 minutes or change IP');
	if (res.status === 401 || res.status === 403 || res.status === 404) {
		const username = `e2echannel${randomBytes(3).toString('hex')}`;
		res = await call('POST', '/auth/signup', {
			body: {
				email: EMAIL,
				password: PASSWORD,
				channel: {
					username,
					name: 'E2E Channel',
					description: 'channel created by the e2e vod script',
				},
			},
		});
		await expectStatus('signup', res, 201);
		res = await call('POST', '/auth/signin', { body: { email: EMAIL, password: PASSWORD } });
	}
	await expectStatus('signin', res, 200);

	// 2. channel id (signup auto-creates one channel; /user/me returns it)
	const meRes = await expectStatus('user/me', await call('GET', '/user/me'), 200);
	const me = (await meRes.json()) as any;
	if (!me.channels?.length) throw new Error('user has no channel; signup should create one');
	const channelId = me.channels[0].id;

	// 3. create video
	const videoName = `e2e vod ${randomBytes(2).toString('hex')}`;
	const videoRes = await expectStatus(
		'create video',
		await call('POST', '/video', {
			body: {
				name: videoName,
				description: 'e2e vod pipeline test video',
				channelId,
				type: 'vod',
				tagIds: [],
			},
		}),
		201,
	);
	const video = (await videoRes.json()) as any;

	// 4. presigned put url — must point at the public endpoint
	const presignRes = await expectStatus(
		'presigned put url',
		await call('GET', `/video/get-presigned-put-url?id=${video.id}&path=untitled.mp4`),
		200,
	);
	const { url: presignedUrl } = (await presignRes.json()) as any;
	const host = new URL(presignedUrl).host;
	if (host !== new URL(S3_PUBLIC).host) {
		throw new Error(`FAIL presigned url host: expected ${new URL(S3_PUBLIC).host}, got ${host}`);
	}
	ok(`presigned url targets public endpoint (${host})`);

	// 5. FAILURE A: confirm before upload
	await expectStatus(
		'confirm-upload before PUT rejected',
		await call('POST', `/video/confirm-upload?id=${video.id}`),
		404,
	);

	// 6. upload
	const file = readFileSync(VIDEO_PATH);
	await expectStatus('presigned PUT file', await call('PUT', presignedUrl, { raw: file }), 200);

	// 7. FAILURE B: queue before confirm
	await expectStatus(
		'send-to-process before confirm rejected',
		await call('POST', `/video/send-video-to-process-queue?id=${video.id}`),
		400,
	);

	// 8-9. confirm + queue
	await expectStatus(
		'confirm-upload after PUT',
		await call('POST', `/video/confirm-upload?id=${video.id}`),
		200,
	);
	await expectStatus(
		'send-to-process-queue',
		await call('POST', `/video/send-video-to-process-queue?id=${video.id}`),
		201,
	);

	// 10. poll status
	console.log('10. waiting for transcode');
	let lastStatus = '';
	const deadline = Date.now() + 20 * 60 * 1000;
	while (Date.now() < deadline) {
		const pollRes = await call('GET', `/video/by-id?id=${video.id}`);
		if (pollRes.status !== 200) throw new Error(`poll by-id returned ${pollRes.status}`);
		const current = ((await pollRes.json()) as any).processingStatus;
		if (current !== lastStatus) {
			console.log(`    status: ${lastStatus} -> ${current}`);
			lastStatus = current;
		}
		if (current === 'failed_in_processing') {
			const full = (await (await call('GET', `/video/by-id?id=${video.id}`)).json()) as any;
			throw new Error(`transcode failed:\n${full.ffmpegProcessLogs}`);
		}
		if (current === 'done') break;
		await new Promise((r) => setTimeout(r, 15000));
	}
	if (lastStatus !== 'done') throw new Error('timed out waiting for processingStatus=done');
	ok('transcode done');

	// 11. hls output fetchable
	const masterRes = await fetch(`${S3_PUBLIC}/hls/${video.videoId}/master.m3u8`);
	if (masterRes.status !== 200) throw new Error(`master.m3u8 returned ${masterRes.status}`);
	const master = await masterRes.text();
	if (!master.includes('#EXTM3U')) throw new Error('master.m3u8 is not a playlist');
	ok('master.m3u8 fetchable');

	const variantMatch = master.match(/manifest_360p\.m3u8/g);
	if (!variantMatch) throw new Error('no 360p variant in master playlist');
	const variantRes = await fetch(`${S3_PUBLIC}/hls/${video.videoId}/manifest_360p.m3u8`);
	if (variantRes.status !== 200) throw new Error(`manifest_360p returned ${variantRes.status}`);
	const variant = await variantRes.text();
	const segment = variant.match(/segment_360p\.ts/);
	if (!segment) throw new Error('no 360p segment in variant playlist');
	const segmentRes = await fetch(`${S3_PUBLIC}/hls/${video.videoId}/segment_360p.ts`);
	if (segmentRes.status !== 200) throw new Error(`segment_360p.ts returned ${segmentRes.status}`);
	ok('variant + segment fetchable');

	// 12. release + search
	await expectStatus(
		'release',
		await call('POST', '/video/release', { body: { id: video.id } }),
		200,
	);
	const searchRes = await expectStatus(
		'search',
		await call('GET', `/video/search?text=${encodeURIComponent(videoName)}`),
		200,
	);
	const results = (await searchRes.json()) as any[];
	if (!results.some((v) => v.id === video.id))
		throw new Error('released video not found in search');
	ok('search finds released video');

	console.log(`\nE2E PASSED (${passed} checks)`);
}

main().catch((err) => {
	console.error(`\nE2E FAILED after ${passed} checks`);
	console.error(err);
	process.exit(1);
});
