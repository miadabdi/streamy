// Shapes live in src/types/api.ts (single source of truth, mirrors schema.ts).
import type {
	ApiFile,
	Channel,
	ChannelWithAvatar,
	Comment,
	Me,
	Playlist,
	Subtitle,
	Tag,
	User,
	Video,
	VideoListItem,
	WatchComment,
	WatchVideo,
} from '../types/api';

export type {
	ApiFile,
	Channel,
	ChannelWithAvatar,
	Comment,
	Me,
	Playlist,
	Subtitle,
	Tag,
	User,
	Video,
	VideoListItem,
	WatchComment,
	WatchVideo,
};

const baseDate = new Date('2026-01-01T00:00:00.000Z');

export function makeUser(overrides: Partial<User> = {}): User {
	return {
		id: 1,
		createdAt: baseDate,
		updatedAt: baseDate,
		email: 'user@example.com',
		password: 'password-hash',
		firstName: 'Mia',
		lastName: 'Doe',
		isAdmin: false,
		isEmailVerified: true,
		passwordChangedAt: null,
		passwordResetToken: null,
		passwordResetExpiresAt: null,
		lastLoginAt: null,
		currentChannelId: null,
		...overrides,
	};
}

/** The GET /user/me shape: user minus secret columns, plus owned channels. */
export function makeMe(overrides: Partial<Me> = {}): Me {
	const secrets: readonly (keyof User)[] = [
		'password',
		'passwordChangedAt',
		'passwordResetToken',
		'passwordResetExpiresAt',
	];
	const user = Object.fromEntries(
		Object.entries(makeUser()).filter(([key]) => !secrets.includes(key as keyof User)),
	) as Omit<
		User,
		'password' | 'passwordChangedAt' | 'passwordResetToken' | 'passwordResetExpiresAt'
	>;
	return { ...user, channels: [makeChannel({ ownerId: user.id })], ...overrides };
}

export function makeChannel(overrides: Partial<Channel> = {}): Channel {
	return {
		id: 1,
		createdAt: baseDate,
		updatedAt: baseDate,
		isActive: true,
		deletedAt: null,
		username: 'channel',
		name: 'Channel',
		description: 'A channel',
		numberOfSubscribers: 0,
		ownerId: 1,
		avatarFileId: null,
		...overrides,
	};
}

export function makeVideo(overrides: Partial<Video> = {}): Video {
	return {
		id: 1,
		videoId: 'dQw4w9WgXcQ',
		createdAt: baseDate,
		updatedAt: baseDate,
		isActive: true,
		deletedAt: null,
		isReleased: true,
		releasedAt: baseDate,
		type: 'vod',
		name: 'A video',
		description: 'A video description',
		numberOfVisits: 0,
		numberOfLikes: 0,
		numberOfDislikes: 0,
		channelId: 1,
		duration: 60,
		ffmpegProcessLogs: null,
		thumbnailFileId: null,
		processingStatus: 'done',
		videoFileId: null,
		...overrides,
	};
}

/** GET /video and /video/search item: video with its embedded relations. */
export function makeVideoListItem(overrides: Partial<VideoListItem> = {}): VideoListItem {
	return {
		...makeVideo(),
		channel: makeChannel(),
		thumbnailFile: null,
		videoFile: null,
		...overrides,
	};
}

export function makePlaylist(overrides: Partial<Playlist> = {}): Playlist {
	return {
		id: 10,
		createdAt: baseDate,
		updatedAt: baseDate,
		isActive: true,
		deletedAt: null,
		name: 'Rack diaries',
		description: 'Everything I did to the closet, in the order I did it.',
		channelId: 1,
		privacy: 'private',
		type: 'custom',
		playlistsVideos: [],
		...overrides,
	};
}

export function makeSubtitle(overrides: Partial<Subtitle> = {}): Subtitle {
	return {
		id: 1,
		createdAt: baseDate,
		updatedAt: baseDate,
		isActive: true,
		deletedAt: null,
		langRFC5646: 'en',
		videoId: 1,
		fileId: 801,
		...overrides,
	};
}

export function makeFile(overrides: Partial<ApiFile> = {}): ApiFile {
	return {
		id: 901,
		createdAt: baseDate,
		updatedAt: baseDate,
		bucketName: 'videothumbnails',
		path: 'thumb.webp',
		mimetype: 'image/webp',
		sizeInByte: 1234,
		userId: 1,
		...overrides,
	};
}

export function makeTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: 1,
		createdAt: baseDate,
		updatedAt: baseDate,
		isActive: true,
		deletedAt: null,
		title: 'ffmpeg',
		...overrides,
	};
}

export function makeComment(overrides: Partial<WatchComment> = {}): WatchComment {
	return {
		id: 1,
		// fresh timestamps keep relative-time assertions ("2 days ago") stable
		createdAt: new Date(Date.now() - 2 * 86_400_000),
		updatedAt: new Date(Date.now() - 86_400_000),
		isActive: true,
		deletedAt: null,
		isEdited: false,
		videoId: 1,
		ownerId: 1, // makeMe's first channel id → "own comment" by default
		replyTo: null,
		content: 'A comment',
		owner: null,
		...overrides,
	};
}

/** GET /video/by-id shape: the video with every embedded relation. */
export function makeWatchVideo(overrides: Partial<WatchVideo> = {}): WatchVideo {
	return {
		...makeVideo(),
		// someone else's channel by default (owner id 1 = the seeded viewer),
		// so the Subscribe button renders
		channel: {
			...makeChannel({ id: 2, ownerId: 2, username: 'nightwatch', name: 'Night Watch' }),
			avatar: null,
		},
		thumbnailFile: null,
		videoFile: null,
		subtitles: [],
		videosToTags: [{ tag: makeTag() }],
		comments: [],
		...overrides,
	};
}
