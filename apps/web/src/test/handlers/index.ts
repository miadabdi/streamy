import type { HttpHandler } from 'msw';
import { authHandlers } from './auth';
import { userHandlers } from './user';

// filled in as features gain mocked endpoints
export const handlers: HttpHandler[] = [...userHandlers, ...authHandlers];
