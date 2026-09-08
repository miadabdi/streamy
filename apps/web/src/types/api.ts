// Mirrors the select types of apps/api/src/drizzle/schema.ts ($inferSelect):
// columns with defaults or no .notNull() are nullable, pg enums are string unions.
// (JSON transport actually carries Dates as ISO strings; types keep Date to stay
// builder-compatible — fixtures.ts re-exports these.)

export type VideoProcessingStatus =
	| 'ready_for_upload'
	| 'ready_for_processing'
	| 'waiting_in_queue'
	| 'processing'
	| 'failed_in_processing'
	| 'done';

export type VideoType = 'vod' | 'live';

export function isPending(status: VideoProcessingStatus | null | undefined): boolean {
	return (
		status === 'ready_for_upload' ||
		status === 'ready_for_processing' ||
		status === 'waiting_in_queue' ||
		status === 'processing'
	);
}

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

// GET /user/me and POST /auth/signup: the user minus secret columns, with owned channels.
export type Me = Omit<
	User,
	'password' | 'passwordChangedAt' | 'passwordResetToken' | 'passwordResetExpiresAt'
> & { channels: Channel[] };

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

export type ApiFile = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	bucketName: string;
	path: string;
	mimetype: string | null;
	sizeInByte: number | null;
	userId: number;
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
	type: VideoType | null;
	name: string;
	description: string;
	numberOfVisits: number | null;
	numberOfLikes: number | null;
	numberOfDislikes: number | null;
	channelId: number;
	duration: number | null;
	ffmpegProcessLogs: string | null;
	thumbnailFileId: number | null;
	processingStatus: VideoProcessingStatus | null;
	videoFileId: number | null;
};

export type Comment = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	isActive: boolean | null;
	deletedAt: Date | null;
	isEdited: boolean | null;
	videoId: number;
	ownerId: number;
	replyTo: number | null;
	content: string;
	// embedded by GET /comment/by-id only
	repliedTo?: Comment | null;
	replies?: Comment[];
};

export type Playlist = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	isActive: boolean | null;
	deletedAt: Date | null;
	name: string;
	description: string;
	channelId: number | null;
	privacy: 'private' | 'public' | null;
	type: 'likes' | 'dislikes' | 'watched' | 'custom' | null;
	// embedded by GET /playlist/by-id only
	playlistsVideos?: { video: Video & { thumbnailFile: ApiFile | null } }[];
};

export type Subtitle = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	isActive: boolean | null;
	deletedAt: Date | null;
	langRFC5646: string;
	videoId: number;
	fileId: number | null;
};

export type Tag = {
	id: number;
	createdAt: Date | null;
	updatedAt: Date | null;
	isActive: boolean | null;
	deletedAt: Date | null;
	title: string;
};
