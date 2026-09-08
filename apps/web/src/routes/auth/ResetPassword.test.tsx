import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { ResetPassword } from './ResetPassword';

const token = 'a'.repeat(64);

function mount(route = `/reset-password?token=${token}`) {
	return renderWithApp(
		<Routes>
			<Route path="/reset-password" element={<ResetPassword />} />
			<Route path="/signin" element={<p>signin marker</p>} />
		</Routes>,
		{ route, session: 'anonymous' },
	);
}

describe('ResetPassword screen', () => {
	it('renders the card and prefills the token from the URL', () => {
		mount();

		expect(screen.getByRole('heading', { name: 'Set a new password' })).toBeInTheDocument();
		expect(screen.getByText('The token came from the link in your email.')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Reset token')).toHaveValue(token);
		expect(screen.getByLabelText('New password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Change password & sign in' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Request a new one' })).toHaveAttribute(
			'href',
			'/forgot-password',
		);
	});

	it('flags a missing token as the wrong length', async () => {
		const user = userEvent.setup();
		mount('/reset-password');

		await user.click(screen.getByRole('button', { name: 'Change password & sign in' }));

		expect(await screen.findByText('Reset token must be 64 characters')).toBeInTheDocument();
		expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
		expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
	});

	it('POSTs email/password/token to /auth/reset-password and navigates to /signin', async () => {
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/reset-password', async ({ request }) => {
				body = await request.json();
				return HttpResponse.json({ message: 'Password Changed Successfully' });
			}),
		);
		const user = userEvent.setup();
		mount();

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.type(screen.getByLabelText('New password'), 'password123');
		await user.click(screen.getByRole('button', { name: 'Change password & sign in' }));

		expect(body).toEqual({
			email: 'user@example.com',
			password: 'password123',
			token,
		});
		expect(await screen.findByText('signin marker')).toBeInTheDocument();
	});
});
