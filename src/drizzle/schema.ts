import { relations } from 'drizzle-orm';
import {
	boolean,
	foreignKey,
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
		path: varchar('path', { length: 1024 }).notNull(),
		mimetype: varchar('mimetype', { length: 50 }),
		sizeInByte: integer('size_in_byte'),
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
	subscriptions: many(subscriptions, { relationName: 'subscriptions' }),
	subscribers: many(subscriptions, { relationName: 'subscribers' }),
}));

export const subscriptions = pgTable(
	'subscriptions',
	{
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		followerId: integer('follower_id').references(() => channels.id),
		followeeId: integer('followee_id').references(() => channels.id),
	},
	(subscriptions) => {
		return {
			pk: primaryKey({
				name: 'subscription_pk',
				columns: [subscriptions.followeeId, subscriptions.followerId],
			}),
		};
	},
);

export const subscriptionsRelations = relations(subscriptions, ({ many, one }) => ({
	follower: one(channels, {
		fields: [subscriptions.followerId],
		references: [channels.id],
		relationName: 'subscriptions',
	}),
	followee: one(channels, {
		fields: [subscriptions.followeeId],
		references: [channels.id],
		relationName: 'subscribers',
	}),
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

export const videoType = pgEnum('video_type', ['vod', 'live']);
export const videoTypeEnum = strEnum(videoType.enumValues);
export type TVideoTypeEnum = keyof typeof videoTypeEnum;

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
		type: videoType('type').default(videoTypeEnum.vod),
		name: varchar('name', { length: 256 }).notNull(),
		description: varchar('description', { length: 2048 }).notNull(),
		numberOfVisits: integer('number_of_visits').default(0),
		numberOfLikes: integer('number_of_likes').default(0),
		numberOfDislikes: integer('numberOfDislikes').default(0),
		channelId: integer('channel_id')
			.notNull()
			.references(() => channels.id),
		duration: integer('duration'),
		ffmpegProcessLogs: text('ffmpeg_process_logs'),
		thumbnailFileId: integer('thumbnail_file_id').references(() => files.id),
		processingStatus: videoProccessingStatus('processing_status').default(
			VideoProccessingStatusEnum.ready_for_upload,
		),
		videoFileId: integer('video_file_id').references(() => files.id),
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
	thumbnailFile: one(files, {
		fields: [videos.thumbnailFileId],
		references: [files.id],
	}),
	videoFile: one(files, {
		fields: [videos.videoFileId],
		references: [files.id],
	}),
	comments: many(comments),
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
	file: one(files, {
		fields: [subtitles.fileId],
		references: [files.id],
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

export const tags = pgTable(
	'tags',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: boolean('is_active').default(true),
		deletedAt: timestamp('deleted_at', { precision: 6, withTimezone: true }),
		title: varchar('title', { length: 128 }).notNull(),
	},
	(tags) => {
		return {
			tagIdx: uniqueIndex('tags_title_idx').on(tags.title),
		};
	},
);

export const tagsVideos = pgTable(
	'tags_videos',
	{
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		tagId: integer('tag_id').references(() => tags.id),
		videoId: integer('video_id').references(() => videos.id),
	},
	(tagsVideos) => {
		return {
			pk: primaryKey({
				name: 'tags_videos_pk',
				columns: [tagsVideos.videoId, tagsVideos.tagId],
			}),
		};
	},
);

export const tagsVideosRelations = relations(tagsVideos, ({ many, one }) => ({
	tag: one(tags, {
		fields: [tagsVideos.tagId],
		references: [tags.id],
	}),
	video: one(videos, {
		fields: [tagsVideos.videoId],
		references: [videos.id],
	}),
}));

export const comments = pgTable(
	'comments',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: boolean('is_active').default(true),
		deletedAt: timestamp('deleted_at', { precision: 6, withTimezone: true }),
		isEdited: boolean('is_edited').default(false),
		videoId: integer('video_id')
			.notNull()
			.references(() => videos.id),
		ownerId: integer('owner_id')
			.notNull()
			.references(() => users.id),
		replyTo: integer('reply_to'),
		content: varchar('content', { length: 1024 }).notNull(),
	},
	(comments) => {
		return {
			videoIdx: index('comments_video_id_idx').on(comments.videoId),
			replyReference: foreignKey({
				columns: [comments.replyTo],
				foreignColumns: [comments.id],
			}).onDelete('set null'),
		};
	},
);

export const commentsRelations = relations(comments, ({ many, one }) => ({
	video: one(videos, {
		fields: [comments.videoId],
		references: [videos.id],
	}),
	owner: one(users, {
		fields: [comments.ownerId],
		references: [users.id],
	}),
	repliedTo: one(comments, {
		fields: [comments.replyTo],
		references: [comments.id],
		relationName: 'comments_parent',
	}),
	replies: many(comments, { relationName: 'comments_parent' }),
}));

export type User = typeof users.$inferSelect;
export type File = typeof files.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Subtitle = typeof subtitles.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistsVideos = typeof playlistsVideos.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type TagsVideos = typeof tagsVideos.$inferSelect;
export type Subscriptions = typeof subscriptions.$inferSelect;
