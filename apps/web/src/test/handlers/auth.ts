import { http, HttpResponse } from 'msw';
import { makeMe } from '../fixtures';

// Mirrors the real API bodies: signin/signout reply 200 with an EMPTY body
// (their handlers return undefined), signup replies 201 with the new user.
export const authHandlers = [
	http.post('/api/v1/auth/signin', () => new HttpResponse(null, { status: 200 })),
	http.post('/api/v1/auth/signup', () => HttpResponse.json(makeMe(), { status: 201 })),
	http.post('/api/v1/auth/forgot-password', () =>
		HttpResponse.json({ message: 'Reset Email Sent' }),
	),
	http.post('/api/v1/auth/reset-password', () =>
		HttpResponse.json({ message: 'Password Changed Successfully' }),
	),
	http.post('/api/v1/auth/signout', () => new HttpResponse(null, { status: 200 })),
];
