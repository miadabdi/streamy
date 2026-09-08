import { act, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/render';
import { server } from '../test/server';
import { searchVideos } from '../test/handlers/video';
import { Search } from './Search';

const requests: string[] = [];

function mount() {
	return renderWithApp(
		<Routes>
			<Route path="/search" element={<Search />} />
			<Route path="/" element={<p>browse marker</p>} />
		</Routes>,
		{ route: '/search' },
	);
}

function recordSearches() {
	server.use(
		http.get('/api/v1/video/search', ({ request }) => {
			requests.push(new URL(request.url).searchParams.get('text') ?? '');
			return HttpResponse.json(searchVideos(new URL(request.url).searchParams));
		}),
	);
}

afterEach(() => {
	vi.useRealTimers();
});

describe('Search screen', () => {
	it('debounces the input: one request after typing settles, none while it has not', async () => {
		recordSearches();
		vi.useFakeTimers();
		mount();

		const input = screen.getByLabelText('Search videos');
		fireEvent.change(input, { target: { value: 'ra' } });
		await act(async () => {
			vi.advanceTimersByTime(200);
		});
		fireEvent.change(input, { target: { value: 'rack' } });
		expect(requests).toHaveLength(0);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(400);
		});
		expect(requests).toEqual(['rack']);
		// drain MSW/react-query internals still parked on the fake clock
		await act(async () => {
			await vi.runAllTimersAsync();
		});
		vi.useRealTimers();

		expect(screen.getByText('Rebuilding the rack')).toBeInTheDocument();
		expect(document.querySelectorAll('.vcard')).toHaveLength(1);
	});

	it('shows the no-results empty state with a link to browse', async () => {
		recordSearches();
		mount();

		expect(screen.getByText('Type to search this instance.')).toBeInTheDocument();

		fireEvent.change(screen.getByLabelText('Search videos'), { target: { value: 'zzz' } });

		expect(await screen.findByText('No videos match “zzz”')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Browse everything' })).toHaveAttribute('href', '/');
		expect(document.querySelector('.vcard')).toBeNull();
	});
});
