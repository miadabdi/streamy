import { http, HttpResponse } from 'msw';
import { makeSubtitle, type Subtitle } from '../fixtures';

// Mirrors subtitle.controller.ts GET /subtitle/by-video-id (global prefix /api/v1):
// plain rows for the numeric videoId, no embedded file relation.
export const subtitlePool: Subtitle[] = [
	makeSubtitle({ id: 1, langRFC5646: 'en' }),
	makeSubtitle({ id: 2, langRFC5646: 'de' }),
];

export const subtitleHandlers = [
	http.get('/api/v1/subtitle/by-video-id', ({ request }) =>
		HttpResponse.json(
			subtitlePool.filter(
				(s) => s.videoId === Number(new URL(request.url).searchParams.get('videoId')),
			),
		),
	),
];
