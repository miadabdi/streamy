import { VideoSearchBody } from './video-search-body.interface';

export interface VideoSearchResult {
	hits: {
		total: number;
		hits: Array<{
			_source: VideoSearchBody;
		}>;
	};
}
