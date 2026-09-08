import { http, HttpResponse } from 'msw';
import { makeMe } from '../fixtures';

// Default session probe: authenticated. Anonymous states are per-test
// `server.use(http.get('/api/v1/user/me', ...))` overrides.
export const userHandlers = [http.get('/api/v1/user/me', () => HttpResponse.json(makeMe()))];
