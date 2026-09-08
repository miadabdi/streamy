import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { ForgotPassword } from './ForgotPassword';

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/forgot-password" element={<ForgotPassword />} />
		</Routes>,
		{ route: '/forgot-password', session: 'anonymous' },
	);
}

describe('ForgotPassword screen', () => {
	it('renders the card with the email field and back link', () => {
		mount();

		expect(screen.getByRole('heading', { name: 'Forgot password' })).toBeInTheDocument();
		expect(
			screen.getByText('We’ll email a reset link. It works once and expires.'),
		).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
			'href',
			'/signin',
		);
	});

	it('shows a zod error for an empty email', async () => {
		const user = userEvent.setup();
		mount();

		await user.click(screen.getByRole('button', { name: 'Send reset link' }));

		expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
	});

	it('POSTs { email } to /auth/forgot-password', async () => {
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/forgot-password', async ({ request }) => {
				body = await request.json();
				return HttpResponse.json({ message: 'Reset Email Sent' });
			}),
		);
		const user = userEvent.setup();
		mount();

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.click(screen.getByRole('button', { name: 'Send reset link' }));

		expect(body).toEqual({ email: 'user@example.com' });
	});
});
