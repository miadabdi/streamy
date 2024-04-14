import { getTableColumns } from 'drizzle-orm';
import * as schema from './schema';

export const usersTableColumns = getTableColumns(schema.users);
export const filesTableColumns = getTableColumns(schema.files);
export const channelsTableColumns = getTableColumns(schema.channels);
export const videosTableColumns = getTableColumns(schema.videos);
export const subtitlesTableColumns = getTableColumns(schema.subtitles);
export const playlistsTableColumns = getTableColumns(schema.playlists);
export const playlistsVideosTableColumns = getTableColumns(schema.playlistsVideos);
export const tagsTableColumns = getTableColumns(schema.tags);
export const tagsVideosTableColumns = getTableColumns(schema.tagsVideos);
export const subscriptionsTableColumns = getTableColumns(schema.subscriptions);
export const commentsTableColumns = getTableColumns(schema.comments);
