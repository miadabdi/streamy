import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { makeReadiness, makeTag } from '../test/fixtures';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { Ops } from './Ops';
import { RequireAdmin } from './RequireAdmin';

function OpsRoutes() {
	return (
		<Routes>
			<Route element={<RequireAdmin />}>
				<Route path="/ops" element={<Ops />} />
			</Route>
		</Routes>
	);
}

function renderOps() {
	return renderWithApp(<OpsRoutes />, { route: '/ops', me: { isAdmin: true } });
}

function readiness(overrides: Parameters<typeof makeReadiness>[0] = {}) {
	server.use(
		http.get('/worker-api/api/v1/health/readiness', () =>
			HttpResponse.json(makeReadiness(overrides)),
		),
	);
}

/** the .stat tile that carries the given stat-label text */
function tile(label: string): HTMLElement {
	return screen.getByText(label).closest('.stat') as HTMLElement;
}

function mockTags(tags: { id: number; title: string }[]) {
	server.use(http.get('/api/v1/tag', () => HttpResponse.json(tags)));
}

describe('Ops', () => {
	it('renders the readiness tiles with a hardware encoder flagged as such', async () => {
		renderOps();

		expect(await screen.findByText('vaapi')).toBeInTheDocument();
		expect(tile('Message queue')).toHaveClass('stat-ok');
		expect(tile('Message queue')).toHaveTextContent('Up');
		expect(tile('Storage')).toHaveClass('stat-ok');
		expect(tile('Storage')).toHaveTextContent('Up');
		expect(tile('Dead letters')).toHaveClass('stat-ok');
		expect(screen.getByText('nothing stuck')).toBeInTheDocument();
		expect(tile('Encoder').querySelector('.stat-flag')).toHaveClass('stat-flag-hw');
		expect(screen.getByText('Hardware')).toBeInTheDocument();
		expect(tile('Active job').textContent).toContain('#7');
		expect(screen.getByText(/elapsed$/)).toBeInTheDocument();
	});

	it('flags the software encoder as a visible fallback', async () => {
		readiness({ encoder: 'libx264' });
		renderOps();

		expect(await screen.findByText('libx264')).toBeInTheDocument();
		expect(tile('Encoder').querySelector('.stat-flag')).toHaveClass('stat-flag-sw');
		expect(screen.getByText('Software fallback')).toBeInTheDocument();
	});

	it('marks failing dependencies and dead letters bad', async () => {
		readiness({ rmq: false, storage: false, deadLetters: 3 });
		renderOps();

		await waitFor(() => expect(tile('Message queue')).toHaveClass('stat-bad'));
		expect(tile('Message queue')).toHaveTextContent('Down');
		expect(tile('Storage')).toHaveClass('stat-bad');
		expect(tile('Storage')).toHaveTextContent('Down');
		expect(tile('Dead letters')).toHaveClass('stat-bad');
		expect(screen.getByText('3', { exact: true })).toBeInTheDocument();
	});

	it('shows an honest empty active job when the worker is idle', async () => {
		readiness({ activeJob: null });
		renderOps();

		expect(await screen.findByText('No active job')).toBeInTheDocument();
		expect(screen.getByText('worker idle, waiting on the queue')).toBeInTheDocument();
	});

	it('renders the active job id in mono with the elapsed time', async () => {
		readiness({ activeJob: { videoId: 42, startedAt: new Date(Date.now() - 372_000).toISOString() } });
		renderOps();

		expect(await screen.findByText('#42')).toBeInTheDocument();
		const value = tile('Active job').querySelector('.stat-value');
		expect(value).toHaveClass('mono');
		expect(screen.getByText('06:12 elapsed')).toBeInTheDocument();
	});

	it('shows an honest error state when the worker is unreachable', async () => {
		server.use(
			http.get('/worker-api/api/v1/health/readiness', () => HttpResponse.error()),
		);
		renderOps();

		expect(await screen.findByText('Worker unreachable')).toBeInTheDocument();
		expect(screen.queryByText('Message queue')).not.toBeInTheDocument();
	});

	describe('tags admin', () => {
		it('lists, creates and confirm-deletes tags', async () => {
			const user = userEvent.setup();
			const tags = [makeTag({ id: 1, title: 'selfhosted' })];
			mockTags(tags);
			server.use(
				http.post('/api/v1/tag', async ({ request }) => {
					const { title } = (await request.json()) as { title: string };
					const tag = makeTag({ id: tags.length + 1, title });
					tags.push(tag);
					return HttpResponse.json(tag, { status: 201 });
				}),
			);
			let deleted = 0;
			server.use(
				http.delete('/api/v1/tag', ({ request }) => {
					deleted += 1;
					const id = Number(new URL(request.url).searchParams.get('id'));
					const index = tags.findIndex((tag) => tag.id === id);
					if (index >= 0) tags.splice(index, 1);
					return HttpResponse.json({ message: 'deleted' });
				}),
			);

			renderOps();
			expect(await screen.findByText('selfhosted')).toBeInTheDocument();

			// create
			await user.type(screen.getByLabelText('New tag title'), 'homelab');
			await user.click(screen.getByRole('button', { name: 'Create' }));
			expect(await screen.findByText('homelab')).toBeInTheDocument();

			// delete needs a confirmed confirm — a dismissal changes nothing
			const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
			await user.click(screen.getByRole('button', { name: 'Delete tag selfhosted' }));
			expect(deleted).toBe(0);
			expect(screen.getByText('selfhosted')).toBeInTheDocument();

			confirm.mockReturnValue(true);
			await user.click(screen.getByRole('button', { name: 'Delete tag selfhosted' }));
			await waitFor(() => expect(deleted).toBe(1));
			await waitFor(() => expect(screen.queryByText('selfhosted')).not.toBeInTheDocument());
			confirm.mockRestore();
		});

		it('keeps the tag list honestly empty when none exist', async () => {
			mockTags([]);
			renderOps();

			expect(await screen.findByText('No tags yet.')).toBeInTheDocument();
		});
	});

	describe('user promotion', () => {
		it('promotes by email and toasts the server success message', async () => {
			const user = userEvent.setup();
			const promoted: string[] = [];
			server.use(
				http.patch('/api/v1/user/promote', async ({ request }) => {
					const { email } = (await request.json()) as { email: string };
					promoted.push(email);
					return HttpResponse.json({ message: 'User promoted to admin successfully' });
				}),
			);

			renderOps();
			await user.type(await screen.findByLabelText('Promote by email'), 'k@home.lan');
			await user.click(screen.getByRole('button', { name: 'Promote' }));

			expect(await screen.findByText('User promoted to admin successfully')).toBeInTheDocument();
			expect(promoted).toEqual(['k@home.lan']);
		});

		it('toasts the honest server error for a nonexistent email', async () => {
			const user = userEvent.setup();
			server.use(
				http.patch('/api/v1/user/promote', () =>
					HttpResponse.json({ message: 'User with email ghost@home.lan not found' }, { status: 404 }),
				),
			);

			renderOps();
			await user.type(await screen.findByLabelText('Promote by email'), 'ghost@home.lan');
			await user.click(screen.getByRole('button', { name: 'Promote' }));

			expect(await screen.findByText('User with email ghost@home.lan not found')).toBeInTheDocument();
		});
	});
});
