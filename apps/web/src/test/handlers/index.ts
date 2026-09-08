import type { HttpHandler } from 'msw';
import { userHandlers } from './user';

// filled in as features gain mocked endpoints
export const handlers: HttpHandler[] = [...userHandlers];
