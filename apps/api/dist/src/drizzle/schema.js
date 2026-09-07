'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.commentsRelations =
	exports.comments =
	exports.tagsVideosRelations =
	exports.tagsVideos =
	exports.tags =
	exports.playlistsVideosRelations =
	exports.playlistsVideos =
	exports.playlistsRelations =
	exports.playlists =
	exports.PlaylistTypeEnum =
	exports.playlistType =
	exports.PlaylistPrivacyEnum =
	exports.playlistPrivacy =
	exports.subtitlesRelations =
	exports.subtitles =
	exports.videosRelations =
	exports.videos =
	exports.videoTypeEnum =
	exports.videoType =
	exports.VideoProccessingStatusEnum =
	exports.videoProccessingStatus =
	exports.subscriptionsRelations =
	exports.subscriptions =
	exports.channelsRelations =
	exports.channels =
	exports.filesRelations =
	exports.files =
	exports.usersRelations =
	exports.users =
		void 0;
const drizzle_orm_1 = require('drizzle-orm');
const pg_core_1 = require('drizzle-orm/pg-core');
const str_enum_1 = require('../common/helpers/str-enum');
exports.users = (0, pg_core_1.pgTable)(
	'users',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		email: (0, pg_core_1.varchar)('email', { length: 50 }).unique().notNull(),
		password: (0, pg_core_1.text)('password').notNull(),
		firstName: (0, pg_core_1.varchar)('first_name', { length: 30 }),
		lastName: (0, pg_core_1.varchar)('last_name', { length: 30 }),
		isAdmin: (0, pg_core_1.boolean)('is_admin').default(false),
		isEmailVerified: (0, pg_core_1.boolean)('is_email_verified').default(false),
		passwordChangedAt: (0, pg_core_1.timestamp)('password_changed_at', {
			precision: 6,
			withTimezone: true,
		}),
		passwordResetToken: (0, pg_core_1.varchar)('password_reset_token', { length: 100 }),
		passwordResetExpiresAt: (0, pg_core_1.timestamp)('password_reset_expires_at', {
			precision: 6,
			withTimezone: true,
		}),
		lastLoginAt: (0, pg_core_1.timestamp)('last_login_at', {
			precision: 6,
			withTimezone: true,
		}),
		currentChannelId: (0, pg_core_1.integer)('current_channel_id'),
	},
	(users) => {
		return {
			emailIdx: (0, pg_core_1.uniqueIndex)('users_email_idx').on(users.email),
		};
	},
);
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
	files: many(exports.files),
	channels: many(exports.channels),
}));
exports.files = (0, pg_core_1.pgTable)(
	'files',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		bucketName: (0, pg_core_1.varchar)('bucket_name', { length: 100 }).notNull(),
		path: (0, pg_core_1.varchar)('path', { length: 1024 }).notNull(),
		mimetype: (0, pg_core_1.varchar)('mimetype', { length: 50 }),
		sizeInByte: (0, pg_core_1.integer)('size_in_byte'),
		userId: (0, pg_core_1.integer)('user_id')
			.notNull()
			.references(() => exports.users.id),
	},
	(files) => {
		return {};
	},
);
exports.filesRelations = (0, drizzle_orm_1.relations)(exports.files, ({ many, one }) => ({
	user: one(exports.users, {
		fields: [exports.files.userId],
		references: [exports.users.id],
	}),
}));
exports.channels = (0, pg_core_1.pgTable)(
	'channels',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: (0, pg_core_1.boolean)('is_active').default(true),
		deletedAt: (0, pg_core_1.timestamp)('deleted_at', { precision: 6, withTimezone: true }),
		username: (0, pg_core_1.varchar)('username', { length: 100 }).notNull().unique(),
		name: (0, pg_core_1.varchar)('name', { length: 50 }).notNull(),
		description: (0, pg_core_1.varchar)('description', { length: 1024 }).notNull(),
		numberOfSubscribers: (0, pg_core_1.integer)('number_of_subscribers').default(0),
		ownerId: (0, pg_core_1.integer)('owner_id')
			.notNull()
			.references(() => exports.users.id),
		avatarFileId: (0, pg_core_1.integer)('avatar_file_id').references(() => exports.files.id),
	},
	(channels) => {
		return {
			usernameIdx: (0, pg_core_1.uniqueIndex)('channels_username_idx').on(channels.username),
		};
	},
);
exports.channelsRelations = (0, drizzle_orm_1.relations)(exports.channels, ({ many, one }) => ({
	owner: one(exports.users, {
		fields: [exports.channels.ownerId],
		references: [exports.users.id],
	}),
	avatar: one(exports.files, {
		fields: [exports.channels.avatarFileId],
		references: [exports.files.id],
	}),
	videos: many(exports.videos),
	subscriptions: many(exports.subscriptions, { relationName: 'subscriptions' }),
	subscribers: many(exports.subscriptions, { relationName: 'subscribers' }),
	playlists: many(exports.playlists),
}));
exports.subscriptions = (0, pg_core_1.pgTable)(
	'subscriptions',
	{
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		followerId: (0, pg_core_1.integer)('follower_id').references(() => exports.channels.id),
		followeeId: (0, pg_core_1.integer)('followee_id').references(() => exports.channels.id),
	},
	(subscriptions) => {
		return {
			pk: (0, pg_core_1.primaryKey)({
				name: 'subscription_pk',
				columns: [subscriptions.followeeId, subscriptions.followerId],
			}),
		};
	},
);
exports.subscriptionsRelations = (0, drizzle_orm_1.relations)(
	exports.subscriptions,
	({ many, one }) => ({
		follower: one(exports.channels, {
			fields: [exports.subscriptions.followerId],
			references: [exports.channels.id],
			relationName: 'subscriptions',
		}),
		followee: one(exports.channels, {
			fields: [exports.subscriptions.followeeId],
			references: [exports.channels.id],
			relationName: 'subscribers',
		}),
	}),
);
exports.videoProccessingStatus = (0, pg_core_1.pgEnum)('video_proccessing_status', [
	'ready_for_upload',
	'ready_for_processing',
	'waiting_in_queue',
	'processing',
	'failed_in_processing',
	'done',
]);
exports.VideoProccessingStatusEnum = (0, str_enum_1.strEnum)(
	exports.videoProccessingStatus.enumValues,
);
exports.videoType = (0, pg_core_1.pgEnum)('video_type', ['vod', 'live']);
exports.videoTypeEnum = (0, str_enum_1.strEnum)(exports.videoType.enumValues);
exports.videos = (0, pg_core_1.pgTable)(
	'videos',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		videoId: (0, pg_core_1.varchar)('video_id', { length: 20 }),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: (0, pg_core_1.boolean)('is_active').default(true),
		deletedAt: (0, pg_core_1.timestamp)('deleted_at', { precision: 6, withTimezone: true }),
		isReleased: (0, pg_core_1.boolean)('is_released').default(false),
		releasedAt: (0, pg_core_1.timestamp)('released_at', { precision: 6, withTimezone: true }),
		type: (0, exports.videoType)('type').default(exports.videoTypeEnum.vod),
		name: (0, pg_core_1.varchar)('name', { length: 256 }).notNull(),
		description: (0, pg_core_1.varchar)('description', { length: 2048 }).notNull(),
		numberOfVisits: (0, pg_core_1.integer)('number_of_visits').default(0),
		numberOfLikes: (0, pg_core_1.integer)('number_of_likes').default(0),
		numberOfDislikes: (0, pg_core_1.integer)('numberOfDislikes').default(0),
		channelId: (0, pg_core_1.integer)('channel_id')
			.notNull()
			.references(() => exports.channels.id),
		duration: (0, pg_core_1.integer)('duration'),
		ffmpegProcessLogs: (0, pg_core_1.text)('ffmpeg_process_logs'),
		thumbnailFileId: (0, pg_core_1.integer)('thumbnail_file_id').references(() => exports.files.id),
		processingStatus: (0, exports.videoProccessingStatus)('processing_status').default(
			exports.VideoProccessingStatusEnum.ready_for_upload,
		),
		videoFileId: (0, pg_core_1.integer)('video_file_id').references(() => exports.files.id),
	},
	(videos) => {
		return {
			channelIdx: (0, pg_core_1.index)('videos_channel_id_idx').on(videos.channelId),
			videoIdx: (0, pg_core_1.uniqueIndex)('videos_video_id_idx').on(videos.videoId),
		};
	},
);
exports.videosRelations = (0, drizzle_orm_1.relations)(exports.videos, ({ many, one }) => ({
	channel: one(exports.channels, {
		fields: [exports.videos.channelId],
		references: [exports.channels.id],
	}),
	subtitles: many(exports.subtitles),
	playlistsVideos: many(exports.playlistsVideos),
	thumbnailFile: one(exports.files, {
		fields: [exports.videos.thumbnailFileId],
		references: [exports.files.id],
	}),
	videoFile: one(exports.files, {
		fields: [exports.videos.videoFileId],
		references: [exports.files.id],
	}),
	comments: many(exports.comments),
	videosToTags: many(exports.tagsVideos),
}));
exports.subtitles = (0, pg_core_1.pgTable)(
	'subtitles',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: (0, pg_core_1.boolean)('is_active').default(true),
		deletedAt: (0, pg_core_1.timestamp)('deleted_at', { precision: 6, withTimezone: true }),
		langRFC5646: (0, pg_core_1.varchar)('lang_RFC5646', { length: 256 }).notNull(),
		videoId: (0, pg_core_1.integer)('video_id')
			.notNull()
			.references(() => exports.videos.id),
		fileId: (0, pg_core_1.integer)('file_id').references(() => exports.files.id),
	},
	(subtitles) => {
		return {};
	},
);
exports.subtitlesRelations = (0, drizzle_orm_1.relations)(exports.subtitles, ({ many, one }) => ({
	video: one(exports.videos, {
		fields: [exports.subtitles.videoId],
		references: [exports.videos.id],
	}),
	file: one(exports.files, {
		fields: [exports.subtitles.fileId],
		references: [exports.files.id],
	}),
}));
exports.playlistPrivacy = (0, pg_core_1.pgEnum)('playlist_privacy', ['private', 'public']);
exports.PlaylistPrivacyEnum = (0, str_enum_1.strEnum)(exports.playlistPrivacy.enumValues);
exports.playlistType = (0, pg_core_1.pgEnum)('playlist_type', [
	'likes',
	'dislikes',
	'watched',
	'custom',
]);
exports.PlaylistTypeEnum = (0, str_enum_1.strEnum)(exports.playlistType.enumValues);
exports.playlists = (0, pg_core_1.pgTable)(
	'playlists',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: (0, pg_core_1.boolean)('is_active').default(true),
		deletedAt: (0, pg_core_1.timestamp)('deleted_at', { precision: 6, withTimezone: true }),
		name: (0, pg_core_1.varchar)('name', { length: 256 }).notNull(),
		description: (0, pg_core_1.varchar)('description', { length: 2048 }).notNull(),
		channelId: (0, pg_core_1.integer)('channel_id').references(() => exports.channels.id),
		privacy: (0, exports.playlistPrivacy)('privacy').default(exports.PlaylistPrivacyEnum.private),
		type: (0, exports.playlistType)('type').default(exports.PlaylistTypeEnum.custom),
	},
	(playlists) => {
		return {};
	},
);
exports.playlistsRelations = (0, drizzle_orm_1.relations)(exports.playlists, ({ many, one }) => ({
	channel: one(exports.channels, {
		fields: [exports.playlists.channelId],
		references: [exports.channels.id],
	}),
	playlistsVideos: many(exports.playlistsVideos),
}));
exports.playlistsVideos = (0, pg_core_1.pgTable)(
	'playlists_videos',
	{
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		playlistId: (0, pg_core_1.integer)('playlist_id').references(() => exports.playlists.id),
		videoId: (0, pg_core_1.integer)('video_id').references(() => exports.videos.id),
	},
	(playlistsVideos) => {
		return {
			pk: (0, pg_core_1.primaryKey)({
				name: 'playlists_videos_pk',
				columns: [playlistsVideos.videoId, playlistsVideos.playlistId],
			}),
		};
	},
);
exports.playlistsVideosRelations = (0, drizzle_orm_1.relations)(
	exports.playlistsVideos,
	({ many, one }) => ({
		playlist: one(exports.playlists, {
			fields: [exports.playlistsVideos.playlistId],
			references: [exports.playlists.id],
		}),
		video: one(exports.videos, {
			fields: [exports.playlistsVideos.videoId],
			references: [exports.videos.id],
		}),
	}),
);
exports.tags = (0, pg_core_1.pgTable)(
	'tags',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: (0, pg_core_1.boolean)('is_active').default(true),
		deletedAt: (0, pg_core_1.timestamp)('deleted_at', { precision: 6, withTimezone: true }),
		title: (0, pg_core_1.varchar)('title', { length: 128 }).notNull(),
	},
	(tags) => {
		return {
			tagIdx: (0, pg_core_1.uniqueIndex)('tags_title_idx').on(tags.title),
		};
	},
);
exports.tagsVideos = (0, pg_core_1.pgTable)(
	'tags_videos',
	{
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		tagId: (0, pg_core_1.integer)('tag_id').references(() => exports.tags.id),
		videoId: (0, pg_core_1.integer)('video_id').references(() => exports.videos.id),
	},
	(tagsVideos) => {
		return {
			pk: (0, pg_core_1.primaryKey)({
				name: 'tags_videos_pk',
				columns: [tagsVideos.videoId, tagsVideos.tagId],
			}),
		};
	},
);
exports.tagsVideosRelations = (0, drizzle_orm_1.relations)(exports.tagsVideos, ({ many, one }) => ({
	tag: one(exports.tags, {
		fields: [exports.tagsVideos.tagId],
		references: [exports.tags.id],
	}),
	video: one(exports.videos, {
		fields: [exports.tagsVideos.videoId],
		references: [exports.videos.id],
	}),
}));
exports.comments = (0, pg_core_1.pgTable)(
	'comments',
	{
		id: (0, pg_core_1.serial)('id').primaryKey(),
		createdAt: (0, pg_core_1.timestamp)('created_at', {
			precision: 6,
			withTimezone: true,
		}).defaultNow(),
		updatedAt: (0, pg_core_1.timestamp)('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		isActive: (0, pg_core_1.boolean)('is_active').default(true),
		deletedAt: (0, pg_core_1.timestamp)('deleted_at', { precision: 6, withTimezone: true }),
		isEdited: (0, pg_core_1.boolean)('is_edited').default(false),
		videoId: (0, pg_core_1.integer)('video_id')
			.notNull()
			.references(() => exports.videos.id),
		ownerId: (0, pg_core_1.integer)('owner_id')
			.notNull()
			.references(() => exports.channels.id),
		replyTo: (0, pg_core_1.integer)('reply_to'),
		content: (0, pg_core_1.varchar)('content', { length: 1024 }).notNull(),
	},
	(comments) => {
		return {
			videoIdx: (0, pg_core_1.index)('comments_video_id_idx').on(comments.videoId),
			replyReference: (0, pg_core_1.foreignKey)({
				columns: [comments.replyTo],
				foreignColumns: [comments.id],
			}).onDelete('set null'),
		};
	},
);
exports.commentsRelations = (0, drizzle_orm_1.relations)(exports.comments, ({ many, one }) => ({
	video: one(exports.videos, {
		fields: [exports.comments.videoId],
		references: [exports.videos.id],
	}),
	owner: one(exports.channels, {
		fields: [exports.comments.ownerId],
		references: [exports.channels.id],
	}),
	repliedTo: one(exports.comments, {
		fields: [exports.comments.replyTo],
		references: [exports.comments.id],
		relationName: 'comments_parent',
	}),
	replies: many(exports.comments, { relationName: 'comments_parent' }),
}));
//# sourceMappingURL=schema.js.map
