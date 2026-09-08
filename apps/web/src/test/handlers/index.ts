import type { HttpHandler } from 'msw';
import { authHandlers } from './auth';
import { userHandlers } from './user';
import { videoHandlers } from './video';

// filled in as features gain mocked endpoints
export const handlers: HttpHandler[] = [...userHandlers, ...authHandlers, ...videoHandlers];
