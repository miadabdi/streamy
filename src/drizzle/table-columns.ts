import { getTableColumns } from 'drizzle-orm';
import * as schema from './schema';

export const usersTableColumns = getTableColumns(schema.users);
export const filesTableColumns = getTableColumns(schema.files);
export const channelsTableColumns = getTableColumns(schema.channels);
export const videosTableColumns = getTableColumns(schema.videos);
export const subtitlesTableColumns = getTableColumns(schema.subtitles);
