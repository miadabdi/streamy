import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { filterVideos } from '../test/handlers/video';
import { Browse } from './Browse';

const requests: URL[] = [];

function mount(session: 'user' | 'anonymous' = 'user') {
	return renderWithApp(
		<Routes>
			<Route path="/" element={<Browse />} />
			<Route path="/watch/:id" element={<p>watch marker</p>} />
		</Routes>,
		{ route: '/', session },
	);
}

function cardTitled(title: string | HTMLElement): HTMLElement {
	const node = typeof title === 'string' ? screen.getByText(title) : title;
	return node.closest('a') as HTMLElement;
}

beforeEach(() => {
	requests.length = 0;
	server.use(
		http.get('/api/v1/video', ({ request }) => {
			requests.push(new URL(request.url));
			return HttpResponse.json(filterVideos(new URL(request.url).searchParams));
		}),
	);
});

describe('Browse screen', () => {
	it('renders released videos as cards with channel, views and likes', async () => {
		mount();

		expect(screen.getByText('Released videos on this instance')).toBeInTheDocument();
		const rack = cardTitled(await screen.findByText('Rebuilding the rack'));
		expect(rack).toHaveAttribute('href', '/watch/1');
		expect(within(rack).getByText('Night Watch')).toBeInTheDocument();
		expect(within(rack).getByText('1,204 views')).toBeInTheDocument();
		expect(within(rack).getByText('38 likes')).toBeInTheDocument();
		expect(within(rack).getByText('18:42')).toHaveClass('vcard-dur');
	});

	it('renders the seeded fallback when a video has no thumbnail, an image when it has one', async () => {
		mount();

		const noThumb = cardTitled(await screen.findByText('No duration video'));
		expect(noThumb.querySelector('.vcard-fallback span')?.textContent).toBe('NW');

		const withThumb = cardTitled(await screen.findByText('With thumbnail video'));
		expect(withThumb.querySelector('img')).toHaveAttribute(
			'src',
			'/storage/videothumbnails/rack.webp',
		);
	});

	it('omits the duration badge when duration is null', async () => {
		mount();

		const card = cardTitled(await screen.findByText('No duration video'));
		expect(card.querySelector('.vcard-dur')).toBeNull();
	});

	it('loads the next page on Load more, advancing the offset', async () => {
		const user = userEvent.setup();
		mount();

		await screen.findByText('Released video 10');
		expect(document.querySelectorAll('.vcard')).toHaveLength(12);
		expect(requests.map((u) => u.searchParams.get('offset'))).toEqual(['0']);

		await user.click(screen.getByRole('button', { name: 'Load more' }));

		expect(await screen.findByText('Released video 20')).toBeInTheDocument();
		expect(document.querySelectorAll('.vcard')).toHaveLength(15);
		expect(requests.map((u) => u.searchParams.get('offset'))).toEqual(['0', '12']);
		expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
	});

	it('live filter sends type=live and renders live cards with the LIVE pill', async () => {
		const user = userEvent.setup();
		mount();

		await screen.findByText('Released video 10');
		await user.click(screen.getByLabelText('Live'));

		expect(await screen.findByText('Live from the closet')).toBeInTheDocument();
		expect(screen.queryByText('Released video 10')).not.toBeInTheDocument();
		expect(requests.some((u) => u.searchParams.get('type') === 'live')).toBe(true);

		const liveCard = cardTitled(await screen.findByText('Live from the closet'));
		expect(liveCard.querySelector('.vcard-flag')?.textContent).toBe('Live');
		expect(liveCard.querySelector('.vcard-dur')).toBeNull();
		expect(screen.getByText('started 30 min ago')).toBeInTheDocument();
	});

	it('subscribed filter sends onlySubbed=true and drops unsubscribed channels', async () => {
		const user = userEvent.setup();
		mount();

		await screen.findByText('kbench cut');
		await user.click(screen.getByLabelText('Subscribed'));

		expect(await screen.findByText('Rebuilding the rack')).toBeInTheDocument();
		expect(screen.queryByText('kbench cut')).not.toBeInTheDocument();
		expect(requests.some((u) => u.searchParams.get('onlySubbed') === 'true')).toBe(true);
	});

	it('hides the subscribed filter for anonymous visitors', async () => {
		mount('anonymous');

		await screen.findByText('Rebuilding the rack');
		expect(screen.queryByLabelText('Subscribed')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Live')).toBeInTheDocument();
	});

	it('shows the empty state when the instance has nothing released', async () => {
		server.use(http.get('/api/v1/video', () => HttpResponse.json([])));
		mount();

		expect(await screen.findByText('Nothing released yet')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Upload your first video' })).toHaveAttribute(
			'href',
			'/studio/upload',
		);
	});
});
