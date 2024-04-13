import { relations } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';
import { strEnum } from '../common/helpers/str-enum';

// Index name convention: [tableName]_[field]_idx

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		email: varchar('email', { length: 50 }).unique().notNull(),
		password: text('password').notNull(),
		firstName: varchar('first_name', { length: 30 }),
		lastName: varchar('last_name', { length: 30 }),
		isAdmin: boolean('is_admin').default(false),
		isEmailVerified: boolean('is_email_verified').default(false),
		passwordChangedAt: timestamp('password_changed_at', { precision: 6, withTimezone: true }),
		passwordResetToken: varchar('password_reset_token', { length: 100 }),
		passwordResetExpiresAt: timestamp('password_reset_expires_at', {
			precision: 6,
			withTimezone: true,
		}),
		lastLoginAt: timestamp('last_login_at', {
			precision: 6,
			withTimezone: true,
		}),
		currentChannelId: integer('current_channel_id'),
	},
	(users) => {
		return {
			emailIdx: uniqueIndex('users_email_idx').on(users.email),
		};
	},
);

export const usersRelations = relations(users, ({ many }) => ({
	files: many(files),
	channels: many(channels),
}));

export const files = pgTable(
	'files',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		bucketName: varchar('bucket_name', { length: 100 }).notNull(),
		path: text('path').notNull(),
		mimetype: varchar('mimetype', { length: 50 }).notNull(),
		sizeInByte: integer('size_in_byte').notNull(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
	},
	(files) => {
		return {};
	},
);

export const filesRelations = relations(files, ({ many, one }) => ({
	user: one(users, {
		fields: [files.userId],
		references: [users.id],
	}),
}));

export const channels = pgTable(
	'channels',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: boolean('is_active').default(true),
		deletedAt: timestamp('deleted_at', { precision: 6, withTimezone: true }),
		username: varchar('username', { length: 100 }).notNull().unique(),
		name: varchar('name', { length: 50 }).notNull(),
		description: varchar('description', { length: 1024 }).notNull(),
		numberOfSubscribers: integer('number_of_subscribers').default(0),
		ownerId: integer('owner_id')
			.notNull()
			.references(() => users.id),
		avatarFileId: integer('avatar_file_id').references(() => files.id),
	},
	(channels) => {
		return {
			usernameIdx: uniqueIndex('channels_username_idx').on(channels.username),
		};
	},
);

export const channelsRelations = relations(channels, ({ many, one }) => ({
	owner: one(users, {
		fields: [channels.ownerId],
		references: [users.id],
	}),
	avatar: one(files, {
		fields: [channels.avatarFileId],
		references: [files.id],
	}),
	videos: many(videos),
}));

export const videoProccessingStatus = pgEnum('video_proccessing_status', [
	'ready_for_upload',
	'ready_for_processing',
	'waiting_in_queue',
	'processing',
	'failed_in_processing',
	'done',
]);
export const VideoProccessingStatusEnum = strEnum(videoProccessingStatus.enumValues);
export type TVideoProccessingStatusEnum = keyof typeof VideoProccessingStatusEnum;

export const videos = pgTable(
	'videos',
	{
		id: serial('id').primaryKey(),
		videoId: varchar('video_id', { length: 20 }),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: boolean('is_active').default(true),
		deletedAt: timestamp('deleted_at', { precision: 6, withTimezone: true }),
		isReleased: boolean('is_released').default(false),
		releasedAt: timestamp('released_at', { precision: 6, withTimezone: true }),
		name: varchar('name', { length: 256 }).notNull(),
		description: varchar('description', { length: 2048 }).notNull(),
		numberOfVisits: integer('number_of_visits').default(0),
		numberOfLikes: integer('number_of_likes').default(0),
		numberOfDislikes: integer('numberOfDislikes').default(0),
		channelId: integer('channel_id')
			.notNull()
			.references(() => channels.id),
		duration: integer('duration'),
		thumbnailFileId: integer('thumbnail_file_id').references(() => files.id),
		processingStatus: videoProccessingStatus('processing_status').default(
			VideoProccessingStatusEnum.ready_for_upload,
		),
	},
	(videos) => {
		return {
			channelIdx: index('videos_channel_id_idx').on(videos.channelId),
			videoIdx: uniqueIndex('videos_video_id_idx').on(videos.videoId),
		};
	},
);

export const videosRelations = relations(videos, ({ many, one }) => ({
	channel: one(channels, {
		fields: [videos.channelId],
		references: [channels.id],
	}),
	subtitles: many(subtitles),
	playlistsVideos: many(playlistsVideos),
}));

export const subtitles = pgTable(
	'subtitles',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: boolean('is_active').default(true),
		deletedAt: timestamp('deleted_at', { precision: 6, withTimezone: true }),
		langRFC5646: varchar('lang_RFC5646', { length: 256 }).notNull(),
		videoId: integer('video_id')
			.notNull()
			.references(() => videos.id),
		fileId: integer('file_id').references(() => files.id),
	},
	(subtitles) => {
		return {};
	},
);

export const subtitlesRelations = relations(subtitles, ({ many, one }) => ({
	video: one(videos, {
		fields: [subtitles.videoId],
		references: [videos.id],
	}),
}));

export const playlistPrivacy = pgEnum('playlist_privacy', ['private', 'public']);
export const PlaylistPrivacyEnum = strEnum(playlistPrivacy.enumValues);
export type TPlaylistPrivacyEnum = keyof typeof PlaylistPrivacyEnum;

export const playlistType = pgEnum('playlist_type', ['likes', 'dislikes', 'watched', 'custom']);
export const PlaylistTypeEnum = strEnum(playlistType.enumValues);
export type TPlaylistTypeEnum = keyof typeof PlaylistTypeEnum;

export const playlists = pgTable(
	'playlists',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: boolean('is_active').default(true),
		deletedAt: timestamp('deleted_at', { precision: 6, withTimezone: true }),
		name: varchar('name', { length: 256 }).notNull(),
		description: varchar('description', { length: 2048 }).notNull(),
		channelId: integer('channel_id').references(() => channels.id),
		privacy: playlistPrivacy('privacy').default(PlaylistPrivacyEnum.private),
		type: playlistType('type').default(PlaylistTypeEnum.custom),
	},
	(playlists) => {
		return {};
	},
);

export const playlistsRelations = relations(playlists, ({ many, one }) => ({
	channel: one(channels, {
		fields: [playlists.channelId],
		references: [channels.id],
	}),
	playlistsVideos: many(playlistsVideos),
}));

export const playlistsVideos = pgTable(
	'playlists_videos',
	{
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		playlistId: integer('playlist_id').references(() => playlists.id),
		videoId: integer('video_id').references(() => videos.id),
	},
	(playlistsVideos) => {
		return {
			pk: primaryKey({
				name: 'playlists_videos_pk',
				columns: [playlistsVideos.videoId, playlistsVideos.playlistId],
			}),
		};
	},
);

export const playlistsVideosRelations = relations(playlistsVideos, ({ many, one }) => ({
	playlist: one(playlists, {
		fields: [playlistsVideos.playlistId],
		references: [playlists.id],
	}),
	video: one(videos, {
		fields: [playlistsVideos.videoId],
		references: [videos.id],
	}),
}));

export type User = typeof users.$inferSelect;
export type File = typeof files.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Subtitle = typeof subtitles.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistsVideos = typeof playlistsVideos.$inferSelect;
