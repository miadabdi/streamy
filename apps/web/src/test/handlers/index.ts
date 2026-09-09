import type { HttpHandler } from 'msw';
import { authHandlers } from './auth';
import { channelHandlers } from './channel';
import { opsHandlers } from './ops';
import { playlistHandlers } from './playlist';
import { subtitleHandlers } from './subtitle';
import { userHandlers } from './user';
import { videoHandlers } from './video';

// filled in as features gain mocked endpoints
export const handlers: HttpHandler[] = [
	...userHandlers,
	...authHandlers,
	...channelHandlers,
	...videoHandlers,
	...subtitleHandlers,
	...playlistHandlers,
	...opsHandlers,
];
