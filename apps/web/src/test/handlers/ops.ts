import { http, HttpResponse } from 'msw';
import { makeReadiness } from '../fixtures';

// Worker readiness (reached through the /worker-api dev proxy — the worker is
// a separate origin on :3001). Tests override with variants (sw encoder, down
// rmq, dead letters) via server.use.
export const opsHandlers = [
	http.get('/worker-api/api/v1/health/readiness', () => HttpResponse.json(makeReadiness())),
];
