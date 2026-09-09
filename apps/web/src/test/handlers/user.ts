import { http, HttpResponse } from 'msw';
import { makeMe } from '../fixtures';

// Default session probe: authenticated. Anonymous states are per-test
// `server.use(http.get('/api/v1/user/me', ...))` overrides.
export const userHandlers = [
	http.get('/api/v1/user/me', () => HttpResponse.json(makeMe())),
	// PATCH /user/update-me and /user/set-current-channel (user.controller.ts)
	http.patch('/api/v1/user/update-me', async ({ request }) =>
		HttpResponse.json(makeMe((await request.json()) as { firstName?: string; lastName?: string })),
	),
	http.patch('/api/v1/user/set-current-channel', async ({ request }) =>
		HttpResponse.json(
			makeMe({
				currentChannelId: ((await request.json()) as { currentChannelId: number }).currentChannelId,
			}),
		),
	),
];
