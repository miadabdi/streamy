import { ChannelService } from '../channel/channel.service';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import { File, User, Video } from '../drizzle/schema';
import { FileService } from '../file/file.service';
import { MinioClientService } from '../minio-client/minio-client.service';
import { PlaylistService } from '../playlist/playlist.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import VideoSearchService from '../search/video-search.service';
import { TagService } from '../tag/tags.service';
import {
	CreateVideoDto,
	DeleteVideoDto,
	SendVideoToProcessQueueDto,
	SetVideoThumbnailDto,
	UpdateVideoDto,
} from './dto';
import { GetVideoPresignedPutURLDto } from './dto/get-video-presigned-put-url.dto';
import { GetVideosDto } from './dto/get-videos';
import { LikeDislikeVideoDto } from './dto/like-dislike-video.dto';
import { SearchVideosDto } from './dto/search-videos.dto';
import { WatchedVideoDto } from './dto/watched-video.dto';
import { SetVideoStatusMsg } from './interface';
import { VideoProcessMsg } from './interface/video-process-msg.interface';
export declare class VideoService {
	private drizzleService;
	private fileService;
	private channelService;
	private producerService;
	private consumerService;
	private tagService;
	private playlistService;
	private videoSearchService;
	private minioClientService;
	private logger;
	constructor(
		drizzleService: DrizzleService,
		fileService: FileService,
		channelService: ChannelService,
		producerService: ProducerService,
		consumerService: ConsumerService,
		tagService: TagService,
		playlistService: PlaylistService,
		videoSearchService: VideoSearchService,
		minioClientService: MinioClientService,
	);
	onModuleInit(): void;
	sendVideoProcessRMQMsg(payload: VideoProcessMsg): Promise<void>;
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
	consumeSetStatusMsg(message: SetVideoStatusMsg): Promise<void>;
	confirmUpload(
		id: number,
		user: User,
	): Promise<{
		message: string;
	}>;
	markVideoFileUploaded(
		bucketName: string,
		filePath: string,
		sizeInByte: number,
		mimetype: string,
	): Promise<void>;
	userOwnsVideo(id: number, user: User, tx?: TransactionType): Promise<Video>;
	generateVideoId(): Promise<string>;
	sendVideoInProcessQueue(
		sendVideoToProcessQueueDto: SendVideoToProcessQueueDto,
		user: User,
	): Promise<{
		message: string;
	}>;
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
	releaseVideo(
		id: number,
		user: User,
	): Promise<{
		message: string;
	}>;
	createVideo(createVideoDto: CreateVideoDto, user: User, tx?: TransactionType): Promise<Video>;
	setVideoThumbnail(
		setVideoThumbnailDto: SetVideoThumbnailDto,
		user: User,
		thumbnail: Express.Multer.File,
	): Promise<File>;
	updateVideo(updateVideoDto: UpdateVideoDto, user: User): Promise<Video>;
	watchedVideo(
		watchedVideoDto: WatchedVideoDto,
		user: User,
		tx?: TransactionType,
	): Promise<{
		message: string;
	}>;
	likeDislikeVideo(
		likeDislikeVideoDto: LikeDislikeVideoDto,
		user: User,
		tx?: TransactionType,
	): Promise<{
		message: string;
	}>;
	getVideoByVideoId(videoId: string): Promise<Video>;
	getLiveByVideoId(
		videoId: string,
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
	getPresignedPutURL(
		getVideoPresignedPutURLDto: GetVideoPresignedPutURLDto,
		user: User,
	): Promise<{
		url: string;
		fileRecord: File;
	}>;
	getVideoById(id: number): Promise<Video>;
	deleteVideo(
		deleteVideoDto: DeleteVideoDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	updateIndexVideo(videoId: number, tx?: TransactionType): Promise<void>;
}
