import { http, HttpResponse } from 'msw';
import { makeChannel, makeFile, makeVideoListItem, type VideoListItem } from '../fixtures';

// Mirrors video.service.ts getAllVideos/search: type defaults to vod,
// onlySubbed keeps subscribed channels, plain-array offset/limit paging.
const nightwatch = makeChannel({ id: 1, username: 'nightwatch', name: 'Night Watch' });
const kbench = makeChannel({ id: 2, username: 'kbench', name: 'kbench' });
const SUBBED_CHANNEL_IDS = new Set([nightwatch.id]);

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

function video(partial: Partial<VideoListItem>): VideoListItem {
	return makeVideoListItem({ channelId: nightwatch.id, channel: nightwatch, ...partial });
}

// 15 released vods (12 fill page one, 3 spill onto page two) + 2 live streams.
export const videoPool: VideoListItem[] = [
	video({
		id: 1,
		videoId: 'vod-rack',
		name: 'Rebuilding the rack',
		duration: 1122,
		numberOfVisits: 1204,
		numberOfLikes: 38,
	}),
	video({ id: 2, videoId: 'vod-nodur', name: 'No duration video', duration: null }),
	video({
		id: 3,
		videoId: 'vod-thumb',
		name: 'With thumbnail video',
		duration: 60,
		thumbnailFileId: 901,
		thumbnailFile: makeFile({ path: 'rack.webp' }),
	}),
	video({ id: 4, videoId: 'vod-kb', name: 'kbench cut', channelId: kbench.id, channel: kbench }),
	...Array.from({ length: 11 }, (_, i) =>
		video({
			id: 10 + i,
			videoId: `vod-${10 + i}`,
			name: `Released video ${10 + i}`,
			duration: 300,
		}),
	),
	video({
		id: 21,
		videoId: 'live-closet',
		name: 'Live from the closet',
		type: 'live',
		duration: null,
		createdAt: minutesAgo(30),
	}),
	video({
		id: 22,
		videoId: 'live-rain',
		name: 'Live rain on the skylight',
		type: 'live',
		duration: null,
		createdAt: minutesAgo(180),
		channelId: kbench.id,
		channel: kbench,
	}),
];

function applyFilters(params: URLSearchParams, pool: VideoListItem[]): VideoListItem[] {
	let list = pool.filter((v) => v.type === (params.get('type') ?? 'vod'));
	if (params.get('onlySubbed') === 'true') {
		list = list.filter((v) => SUBBED_CHANNEL_IDS.has(v.channelId));
	}
	const offset = Number(params.get('offset') ?? 0);
	const limit = Number(params.get('limit') ?? 10);
	return list.slice(offset, offset + limit);
}

export function filterVideos(params: URLSearchParams): VideoListItem[] {
	return applyFilters(params, videoPool);
}

export function searchVideos(params: URLSearchParams): VideoListItem[] {
	const text = (params.get('text') ?? '').toLowerCase();
	const matches = videoPool.filter(
		(v) => v.name.toLowerCase().includes(text) || v.description.toLowerCase().includes(text),
	);
	return applyFilters(params, matches);
}

export const videoHandlers = [
	http.get('/api/v1/video', ({ request }) =>
		HttpResponse.json(filterVideos(new URL(request.url).searchParams)),
	),
	http.get('/api/v1/video/search', ({ request }) =>
		HttpResponse.json(searchVideos(new URL(request.url).searchParams)),
	),
];
