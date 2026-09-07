import { DrizzleService } from '../drizzle/drizzle.service';
import { User } from '../drizzle/schema';
import {
	CreateVideoDto,
	DeleteVideoDto,
	GetLiveByVideoIdDto,
	GetVideoByIdDto,
	GetVideoByVideoIdDto,
	SendVideoToProcessQueueDto,
	SetVideoThumbnailDto,
	UpdateVideoDto,
	ConfirmVideoUploadDto,
} from './dto';
import { GetVideoPresignedPutURLDto } from './dto/get-video-presigned-put-url.dto';
import { GetVideosDto } from './dto/get-videos';
import { LikeDislikeVideoDto } from './dto/like-dislike-video.dto';
import { SearchVideosDto } from './dto/search-videos.dto';
import { WatchedVideoDto } from './dto/watched-video.dto';
import { VideoService } from './video.service';
export declare class VideoController {
	private videoService;
	private drizzleService;
	constructor(videoService: VideoService, drizzleService: DrizzleService);
	confirmUpload(
		confirmVideoUploadDto: ConfirmVideoUploadDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	sendVideoInProcessQueue(
		sendVideoInProcessQueueDto: SendVideoToProcessQueueDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	likeDislikeVideo(likeDislikeVideoDto: LikeDislikeVideoDto, user: User): Promise<any>;
	watchedVideo(watchedVideoDto: WatchedVideoDto, user: User): Promise<any>;
	createVideo(
		createVideoDto: CreateVideoDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'live' | 'vod';
		id: number;
		videoId: string;
		duration: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		isReleased: boolean;
		releasedAt: Date;
		numberOfVisits: number;
		numberOfLikes: number;
		numberOfDislikes: number;
		ffmpegProcessLogs: string;
		thumbnailFileId: number;
		processingStatus:
			| 'failed_in_processing'
			| 'done'
			| 'ready_for_upload'
			| 'ready_for_processing'
			| 'waiting_in_queue'
			| 'processing';
		videoFileId: number;
	}>;
	getLiveByVideoId(
		getLiveByVideoIdDto: GetLiveByVideoIdDto,
	): import('drizzle-orm/pg-core/query-builders/query').PgRelationalQuery<{
		name: string;
		description: string;
		channelId: number;
		type: 'live' | 'vod';
		id: number;
		videoId: string;
		duration: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		isReleased: boolean;
		releasedAt: Date;
		numberOfVisits: number;
		numberOfLikes: number;
		numberOfDislikes: number;
		ffmpegProcessLogs: string;
		thumbnailFileId: number;
		processingStatus:
			| 'failed_in_processing'
			| 'done'
			| 'ready_for_upload'
			| 'ready_for_processing'
			| 'waiting_in_queue'
			| 'processing';
		videoFileId: number;
	}>;
	releaseVideo(
		id: number,
		user: User,
	): Promise<{
		message: string;
	}>;
	updateVideo(
		updateVideoDto: UpdateVideoDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'live' | 'vod';
		id: number;
		videoId: string;
		duration: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		isReleased: boolean;
		releasedAt: Date;
		numberOfVisits: number;
		numberOfLikes: number;
		numberOfDislikes: number;
		ffmpegProcessLogs: string;
		thumbnailFileId: number;
		processingStatus:
			| 'failed_in_processing'
			| 'done'
			| 'ready_for_upload'
			| 'ready_for_processing'
			| 'waiting_in_queue'
			| 'processing';
		videoFileId: number;
	}>;
	setVideoThumbnail(
		setVideoThumbnailDto: SetVideoThumbnailDto,
		user: User,
		thumbnail: Express.Multer.File,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		bucketName: string;
		path: string;
		mimetype: string;
		sizeInByte: number;
		userId: number;
	}>;
	getVideoById(
		getVideoByIdDto: GetVideoByIdDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'live' | 'vod';
		id: number;
		videoId: string;
		duration: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		isReleased: boolean;
		releasedAt: Date;
		numberOfVisits: number;
		numberOfLikes: number;
		numberOfDislikes: number;
		ffmpegProcessLogs: string;
		thumbnailFileId: number;
		processingStatus:
			| 'failed_in_processing'
			| 'done'
			| 'ready_for_upload'
			| 'ready_for_processing'
			| 'waiting_in_queue'
			| 'processing';
		videoFileId: number;
	}>;
	getVideoByVideoId(
		getVideoByVideoIdDto: GetVideoByVideoIdDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'live' | 'vod';
		id: number;
		videoId: string;
		duration: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		isReleased: boolean;
		releasedAt: Date;
		numberOfVisits: number;
		numberOfLikes: number;
		numberOfDislikes: number;
		ffmpegProcessLogs: string;
		thumbnailFileId: number;
		processingStatus:
			| 'failed_in_processing'
			| 'done'
			| 'ready_for_upload'
			| 'ready_for_processing'
			| 'waiting_in_queue'
			| 'processing';
		videoFileId: number;
	}>;
	getAllVideos(
		getVideosDto: GetVideosDto,
		user: User,
	): Promise<
		{
			name: string;
			description: string;
			channelId: number;
			type: 'live' | 'vod';
			id: number;
			videoId: string;
			duration: number;
			createdAt: Date;
			updatedAt: Date;
			isActive: boolean;
			deletedAt: Date;
			isReleased: boolean;
			releasedAt: Date;
			numberOfVisits: number;
			numberOfLikes: number;
			numberOfDislikes: number;
			ffmpegProcessLogs: string;
			thumbnailFileId: number;
			processingStatus:
				| 'failed_in_processing'
				| 'done'
				| 'ready_for_upload'
				| 'ready_for_processing'
				| 'waiting_in_queue'
				| 'processing';
			videoFileId: number;
			channel: {
				name: string;
				description: string;
				id: number;
				createdAt: Date;
				updatedAt: Date;
				isActive: boolean;
				deletedAt: Date;
				username: string;
				numberOfSubscribers: number;
				ownerId: number;
				avatarFileId: number;
			};
			thumbnailFile: {
				id: number;
				createdAt: Date;
				updatedAt: Date;
				bucketName: string;
				path: string;
				mimetype: string;
				sizeInByte: number;
				userId: number;
			};
			videoFile: {
				id: number;
				createdAt: Date;
				updatedAt: Date;
				bucketName: string;
				path: string;
				mimetype: string;
				sizeInByte: number;
				userId: number;
			};
		}[]
	>;
	getAllVideosOfMyChannel(
		getVideosDto: GetVideosDto,
		user: User,
	): Promise<
		{
			name: string;
			description: string;
			channelId: number;
			type: 'live' | 'vod';
			id: number;
			videoId: string;
			duration: number;
			createdAt: Date;
			updatedAt: Date;
			isActive: boolean;
			deletedAt: Date;
			isReleased: boolean;
			releasedAt: Date;
			numberOfVisits: number;
			numberOfLikes: number;
			numberOfDislikes: number;
			ffmpegProcessLogs: string;
			thumbnailFileId: number;
			processingStatus:
				| 'failed_in_processing'
				| 'done'
				| 'ready_for_upload'
				| 'ready_for_processing'
				| 'waiting_in_queue'
				| 'processing';
			videoFileId: number;
			channel: {
				name: string;
				description: string;
				id: number;
				createdAt: Date;
				updatedAt: Date;
				isActive: boolean;
				deletedAt: Date;
				username: string;
				numberOfSubscribers: number;
				ownerId: number;
				avatarFileId: number;
			};
			thumbnailFile: {
				id: number;
				createdAt: Date;
				updatedAt: Date;
				bucketName: string;
				path: string;
				mimetype: string;
				sizeInByte: number;
				userId: number;
			};
			videoFile: {
				id: number;
				createdAt: Date;
				updatedAt: Date;
				bucketName: string;
				path: string;
				mimetype: string;
				sizeInByte: number;
				userId: number;
			};
		}[]
	>;
	search(
		searchVideosDto: SearchVideosDto,
		user: User,
	): Promise<
		{
			name: string;
			description: string;
			channelId: number;
			type: 'live' | 'vod';
			id: number;
			videoId: string;
			duration: number;
			createdAt: Date;
			updatedAt: Date;
			isActive: boolean;
			deletedAt: Date;
			isReleased: boolean;
			releasedAt: Date;
			numberOfVisits: number;
			numberOfLikes: number;
			numberOfDislikes: number;
			ffmpegProcessLogs: string;
			thumbnailFileId: number;
			processingStatus:
				| 'failed_in_processing'
				| 'done'
				| 'ready_for_upload'
				| 'ready_for_processing'
				| 'waiting_in_queue'
				| 'processing';
			videoFileId: number;
			channel: {
				name: string;
				description: string;
				id: number;
				createdAt: Date;
				updatedAt: Date;
				isActive: boolean;
				deletedAt: Date;
				username: string;
				numberOfSubscribers: number;
				ownerId: number;
				avatarFileId: number;
			};
			thumbnailFile: {
				id: number;
				createdAt: Date;
				updatedAt: Date;
				bucketName: string;
				path: string;
				mimetype: string;
				sizeInByte: number;
				userId: number;
			};
			videoFile: {
				id: number;
				createdAt: Date;
				updatedAt: Date;
				bucketName: string;
				path: string;
				mimetype: string;
				sizeInByte: number;
				userId: number;
			};
		}[]
	>;
	getPresignedPutURL(
		getVideoPresignedPutURLDto: GetVideoPresignedPutURLDto,
		user: User,
	): Promise<{
		url: string;
		fileRecord: import('../drizzle/schema').File;
	}>;
	deleteVideo(
		deleteVideoDto: DeleteVideoDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
