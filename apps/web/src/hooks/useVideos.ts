import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { VideoListItem } from '../types/api';

// GET /video replies with a plain array (no total), so paging is Load more:
// each page steps offset by PAGE_SIZE until a short page says we are done.
export const VIDEO_PAGE_SIZE = 12;

export type VideoFilter = 'all' | 'live' | 'subscribed';

function nextOffset(lastPage: VideoListItem[], allPages: VideoListItem[][]): number | undefined {
	return lastPage.length === VIDEO_PAGE_SIZE ? allPages.length * VIDEO_PAGE_SIZE : undefined;
}

export function useVideos(filter: VideoFilter) {
	return useInfiniteQuery({
		queryKey: ['videos', filter],
		initialPageParam: 0,
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({
				offset: String(pageParam),
				limit: String(VIDEO_PAGE_SIZE),
			});
			if (filter === 'live') params.set('type', 'live'); // server defaults to vod
			if (filter === 'subscribed') params.set('onlySubbed', 'true');
			return api.get<VideoListItem[]>(`/api/v1/video?${params}`);
		},
		getNextPageParam: nextOffset,
	});
}

export function useVideoSearch(text: string) {
	return useInfiniteQuery({
		queryKey: ['videoSearch', text],
		enabled: text !== '',
		initialPageParam: 0,
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({
				text,
				offset: String(pageParam),
				limit: String(VIDEO_PAGE_SIZE),
			});
			return api.get<VideoListItem[]>(`/api/v1/video/search?${params}`);
		},
		getNextPageParam: nextOffset,
	});
}
