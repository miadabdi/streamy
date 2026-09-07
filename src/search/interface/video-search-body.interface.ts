import { Video } from '../../drizzle/schema';

/**
 * the search index only serves name/description matching + id hydration —
 * counters and relations are read from postgres, so they are not indexed
 */
export interface VideoSearchBody extends Pick<Video, 'id' | 'name' | 'description'> {}
