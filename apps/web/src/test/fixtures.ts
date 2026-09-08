// Shapes live in src/types/api.ts (single source of truth, mirrors schema.ts).
import type { ApiFile, Channel, Me, User, Video, VideoListItem } from '../types/api';

export type { ApiFile, Channel, Me, User, Video, VideoListItem };

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
