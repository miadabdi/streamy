import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes, useNavigate } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { filterVideos } from '../test/handlers/video';
import { Channel } from './Channel';

// the sidenav navigates channel→channel without remounting the route element
function GoToKbench() {
	const navigate = useNavigate();
	return (
		<button type="button" onClick={() => navigate('/channel/kbench')}>
			go kbench
		</button>
	);
}

const subPosts: string[] = [];
const videoRequests: URL[] = [];

function mount(username = 'nightwatch', session: 'user' | 'anonymous' = 'user') {
	return renderWithApp(
		<Routes>
			<Route path="/channel/:username" element={<Channel />} />
		</Routes>,
		{ route: `/channel/${username}`, session },
	);
}

beforeEach(() => {
	subPosts.length = 0;
	videoRequests.length = 0;
	server.use(
		http.get('/api/v1/video', ({ request }) => {
			videoRequests.push(new URL(request.url));
			return HttpResponse.json(filterVideos(new URL(request.url).searchParams));
		}),
		http.post('/api/v1/channel/add-subscription', async ({ request }) => {
			subPosts.push(String(((await request.json()) as { followeeId: number }).followeeId));
			// a beat of latency keeps the optimistic state observable in tests
			await new Promise((resolve) => setTimeout(resolve, 25));
			return new HttpResponse(null, { status: 201 });
		}),
		http.post('/api/v1/channel/delete-subscription', async ({ request }) => {
			subPosts.push(String(((await request.json()) as { followeeId: number }).followeeId));
			await new Promise((resolve) => setTimeout(resolve, 25));
			return new HttpResponse(null, { status: 201 });
		}),
	);
});

describe('Channel page', () => {
	it('renders the header from the channel payload: name, handle, count, description, initials avatar', async () => {
		mount();

		expect(await screen.findByRole('heading', { level: 1, name: 'Night Watch' })).toBeInTheDocument();
		expect(screen.getByText('@nightwatch · 184 subscribers')).toBeInTheDocument();
		expect(
			screen.getByText(
				'A closet full of second-hand hardware and the transcoding it does overnight.',
			),
		).toBeInTheDocument();
		const avatar = screen.getByText('NW');
		expect(avatar).toHaveClass('avatar', 'avatar-lg');
	});

	it('lists only the channel’s released vods, asking for channelId and the default vod type', async () => {
		mount();

		expect(await screen.findByText('Rebuilding the rack')).toBeInTheDocument();
		expect(screen.queryByText('kbench cut')).not.toBeInTheDocument(); // other channel
		expect(screen.queryByText('Live from the closet')).not.toBeInTheDocument(); // type=live
		expect(videoRequests[0].searchParams.get('channelId')).toBe('1');
		expect(videoRequests[0].searchParams.get('type')).toBeNull();
	});

	it('loads the next page on Load more', async () => {
		const user = userEvent.setup();
		mount();

		await screen.findByText('Rebuilding the rack');
		expect(document.querySelectorAll('.vcard')).toHaveLength(12);

		await user.click(screen.getByRole('button', { name: 'Load more' }));

		expect(await screen.findByText('Released video 20')).toBeInTheDocument();
		expect(document.querySelectorAll('.vcard')).toHaveLength(14);
		expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
	});

	it('subscribes and unsubscribes with an optimistic subscriber count', async () => {
		const user = userEvent.setup();
		mount();

		await screen.findByRole('heading', { name: 'Night Watch' });
		await user.click(screen.getByRole('button', { name: 'Subscribe' }));
		expect(screen.getByText('@nightwatch · 185 subscribers')).toBeInTheDocument(); // optimistic
		expect(screen.getByRole('button', { name: 'Subscribed' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Subscribed' }));
		await waitFor(() =>
			expect(screen.getByText('@nightwatch · 184 subscribers')).toBeInTheDocument(),
		);
		expect(subPosts).toEqual(['1', '1']); // followeeId both ways
	});

	it('hides Subscribe for anonymous visitors and links to signin', async () => {
		mount('nightwatch', 'anonymous');

		expect(await screen.findByRole('heading', { name: 'Night Watch' }));
		expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Sign in to subscribe' })).toHaveAttribute(
			'href',
			'/signin',
		);
	});

	it('hides Subscribe on your own channel', async () => {
		mount('mine');

		await screen.findByRole('heading', { name: 'My Channel' });
		expect(screen.queryByRole('button', { name: 'Subscribe' })).not.toBeInTheDocument();
	});

	it('shows a not-found state for an unknown username', async () => {
		mount('ghost');

		expect(await screen.findByText('No channel named @ghost')).toBeInTheDocument();
		expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
	});

	it('resets the subscribe toggle when navigating to another channel', async () => {
		const user = userEvent.setup();
		renderWithApp(
			<Routes>
				<Route
					path="/channel/:username"
					element={
						<>
							<Channel />
							<GoToKbench />
						</>
					}
				/>
			</Routes>,
			{ route: '/channel/nightwatch' },
		);

		await screen.findByRole('heading', { name: 'Night Watch' });
		await user.click(screen.getByRole('button', { name: 'Subscribe' }));
		expect(screen.getByRole('button', { name: 'Subscribed' })).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'go kbench' }));

		expect(await screen.findByRole('heading', { name: 'kbench' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument(); // reset, not "Subscribed"
	});

	it('shows the empty state when the channel has nothing released', async () => {
		server.use(http.get('/api/v1/video', () => HttpResponse.json([])));
		mount();

		expect(
			await screen.findByText('Night Watch hasn’t released anything yet'),
		).toBeInTheDocument();
		expect(document.querySelectorAll('.vcard')).toHaveLength(0);
	});
});
