import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../../test/render';
import { server } from '../../test/server';
import { SignUp } from './SignUp';

const validValues = {
	email: 'new@example.com',
	password: 'password123',
	username: 'nightwatch',
	name: 'Night Watch',
	description: 'A channel for the small hours',
};

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/signup" element={<SignUp />} />
			<Route path="/signin" element={<p>signin marker</p>} />
		</Routes>,
		{ route: '/signup', session: 'anonymous' },
	);
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('Email'), validValues.email);
	await user.type(screen.getByLabelText('Password'), validValues.password);
	await user.type(screen.getByLabelText('Channel username'), validValues.username);
	await user.type(screen.getByLabelText('Display name'), validValues.name);
	await user.type(screen.getByLabelText('Description'), validValues.description);
}

describe('SignUp screen', () => {
	it('renders the account + first-channel form', () => {
		mount();

		expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Your first channel' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Create account & channel' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin');
	});

	it('shows a zod error per DTO constraint on empty submit', async () => {
		const user = userEvent.setup();
		mount();

		await user.click(screen.getByRole('button', { name: 'Create account & channel' }));

		expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
		expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
		expect(screen.getByText('Channel username must be at least 8 characters')).toBeInTheDocument();
		expect(screen.getByText('Display name must be at least 3 characters')).toBeInTheDocument();
		expect(screen.getByText('Description must be at least 8 characters')).toBeInTheDocument();
	});

	it('rejects usernames the backend regex rejects (leading underscore)', async () => {
		const user = userEvent.setup();
		mount();

		await user.type(screen.getByLabelText('Channel username'), '_badusername');
		await user.click(screen.getByRole('button', { name: 'Create account & channel' }));

		expect(
			await screen.findByText(
				'Channel username must contain no _ or . at the beginning or end',
			),
		).toBeInTheDocument();
	});

	it('POSTs the nested channel DTO body and navigates to /signin on success', async () => {
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/signup', async ({ request }) => {
				body = await request.json();
				return HttpResponse.json({}, { status: 201 });
			}),
		);
		const user = userEvent.setup();
		mount();

		await fillValid(user);
		await user.click(screen.getByRole('button', { name: 'Create account & channel' }));

		expect(body).toEqual({
			email: validValues.email,
			password: validValues.password,
			channel: {
				username: validValues.username,
				name: validValues.name,
				description: validValues.description,
			},
		});
		expect(await screen.findByText('signin marker')).toBeInTheDocument();
	});
});
