import { http, HttpResponse } from 'msw';
import { makeChannel, type ChannelWithAvatar } from '../fixtures';

// Mirrors channel.controller.ts GET /channel/by-username (global prefix /api/v1):
// the channel row with its avatar relation, or null when the username is unknown.
// nightwatch keeps id 1 so the video handler's channelId filter lines up.
const nightwatch: ChannelWithAvatar = {
	...makeChannel({
		id: 1,
		ownerId: 2,
		username: 'nightwatch',
		name: 'Night Watch',
		description: 'A closet full of second-hand hardware and the transcoding it does overnight.',
		numberOfSubscribers: 184,
	}),
	avatar: null,
};

const kbench: ChannelWithAvatar = {
	...makeChannel({ id: 2, ownerId: 3, username: 'kbench', name: 'kbench' }),
	avatar: null,
};

const mine: ChannelWithAvatar = {
	...makeChannel({ id: 5, ownerId: 1, username: 'mine', name: 'My Channel' }),
	avatar: null,
};

export const channelPool: ChannelWithAvatar[] = [nightwatch, kbench, mine];

export const channelHandlers = [
	http.get('/api/v1/channel/by-username', ({ request }) => {
		const username = new URL(request.url).searchParams.get('username');
		return HttpResponse.json(channelPool.find((c) => c.username === username) ?? null);
	}),
];
