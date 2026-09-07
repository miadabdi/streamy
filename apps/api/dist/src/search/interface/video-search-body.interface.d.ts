import { Video } from '../../drizzle/schema';
export interface VideoSearchBody extends Pick<Video, 'id' | 'name' | 'description'> {}
