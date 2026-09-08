import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../../test/render';
import { makeMe } from '../../test/fixtures';
import { useMe } from '../../lib/auth';
import { server } from '../../test/server';
import { SignIn } from './SignIn';

// The post-signin landing page: consumes the real ['me'] query, like every
// authenticated screen does via RequireAuth.
function MeProbe() {
	const { data } = useMe();
	return <p>signed in as {data?.email ?? 'anonymous'}</p>;
}

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/" element={<MeProbe />} />
			<Route path="/signin" element={<SignIn />} />
		</Routes>,
		{ route: '/signin', session: 'anonymous' },
	);
}

describe('SignIn screen', () => {
	it('renders the card with fields and links', () => {
		mount();

		expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
		expect(screen.getByText('Welcome back.')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute(
			'href',
			'/forgot-password',
		);
		expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/signup');
	});

	it('shows zod errors for invalid input', async () => {
		const user = userEvent.setup();
		mount();

		await user.click(screen.getByRole('button', { name: 'Sign in' }));

		expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
		expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
	});

	it('flips [me] from anonymous to the session user and navigates on success', async () => {
		let body: unknown;
		server.use(
			http.post('/api/v1/auth/signin', async ({ request }) => {
				body = await request.json();
				return new HttpResponse(null, { status: 200 });
			}),
		);
		const user = userEvent.setup();
		const { queryClient } = mount();

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.type(screen.getByLabelText('Password'), 'password123');
		await user.click(screen.getByRole('button', { name: 'Sign in' }));

		expect(body).toEqual({ email: 'user@example.com', password: 'password123' });
		await waitFor(() =>
			expect(queryClient.getQueryData(['me'])).toEqual(
				JSON.parse(JSON.stringify(makeMe())) as unknown as ReturnType<typeof makeMe>,
			),
		);
		expect(await screen.findByText('signed in as user@example.com')).toBeInTheDocument();
	});

	it('surfaces API rejections as a form-level alert', async () => {
		server.use(
			http.post('/api/v1/auth/signin', () =>
				HttpResponse.json({ message: 'Credentials is incorrect' }, { status: 403 }),
			),
		);
		const user = userEvent.setup();
		mount();

		await user.type(screen.getByLabelText('Email'), 'user@example.com');
		await user.type(screen.getByLabelText('Password'), 'password123');
		await user.click(screen.getByRole('button', { name: 'Sign in' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Credentials is incorrect');
	});
});
