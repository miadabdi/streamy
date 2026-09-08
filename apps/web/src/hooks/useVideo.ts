import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { isPending, type WatchVideo } from '../types/api';

/** GET /video/by-id: the video with embedded comments, channel, tags, subtitles. */
export function useVideo(id: number) {
	return useQuery({
		queryKey: ['video', id],
		queryFn: () => api.get<WatchVideo>(`/api/v1/video/by-id?id=${id}`),
		enabled: Number.isInteger(id),
		// polling lives in the query options (plan risk #6), never in a
		// component interval: 5s while the encoder is still working
		refetchInterval: (query) => (isPending(query.state.data?.processingStatus) ? 5_000 : false),
	});
}
