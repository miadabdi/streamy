// Shapes mirror the select types of apps/api/src/drizzle/schema.ts ($inferSelect):
// columns with defaults or no .notNull() are nullable, enums are their string unions.

export type User = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	email: string;
	password: string;
	firstName: string | null;
	lastName: string | null;
	isAdmin: boolean | null;
	isEmailVerified: boolean | null;
	passwordChangedAt: Date | null;
	passwordResetToken: string | null;
	passwordResetExpiresAt: Date | null;
	lastLoginAt: Date | null;
	currentChannelId: number | null;
};

export type Channel = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	isActive: boolean | null;
	deletedAt: Date | null;
	username: string;
	name: string;
	description: string;
	numberOfSubscribers: number | null;
	ownerId: number;
	avatarFileId: number | null;
};

export type Video = {
	id: number;
	videoId: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	isActive: boolean | null;
	deletedAt: Date | null;
	isReleased: boolean | null;
	releasedAt: Date | null;
	type: 'vod' | 'live' | null;
	name: string;
	description: string;
	numberOfVisits: number | null;
	numberOfLikes: number | null;
	numberOfDislikes: number | null;
	channelId: number;
	duration: number | null;
	ffmpegProcessLogs: string | null;
	thumbnailFileId: number | null;
	processingStatus:
		| 'ready_for_upload'
		| 'ready_for_processing'
		| 'waiting_in_queue'
		| 'processing'
		| 'failed_in_processing'
		| 'done'
		| null;
	videoFileId: number | null;
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
