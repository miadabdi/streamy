import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { and, desc, eq, gt, inArray, or, sql } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
import { GetUser } from '../common/decorators';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { File, User, Video } from '../drizzle/schema';
import { videosTableColumns } from '../drizzle/table-columns';
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
import { ILikeType, LikeDislikeVideoDto } from './dto/like-dislike-video.dto';
import { SearchVideosDto } from './dto/search-videos.dto';
import { WatchedVideoDto } from './dto/watched-video.dto';
import { SetVideoStatusMsg } from './interface';
import { VideoProcessMsg } from './interface/video-process-msg.interface';

/**
 * live video payload served on /by-id and /live-by-video-id: computed stream
 * state plus the live timestamps serialized as ISO strings
 */
export type LiveVideoStatePayload = Omit<Video, 'liveStartedAt' | 'disconnectedAt'> & {
	liveState: 'live' | 'reconnecting' | 'ended';
	/** null until the first publish / a disconnect happened */
	liveStartedAt: string | null;
	disconnectedAt: string | null;
};

@Injectable()
export class VideoService {
	private logger = new Logger(VideoService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
		private channelService: ChannelService,
		private producerService: ProducerService,
		private consumerService: ConsumerService,
		@Inject(forwardRef(() => TagService))
		private tagService: TagService,
		private playlistService: PlaylistService,
		private videoSearchService: VideoSearchService,
		private minioClientService: MinioClientService,
		private configService: ConfigService,
	) {}

	onModuleInit() {
		this.consumerService.listenOnQueue('q.set.video.status', this.consumeSetStatusMsg.bind(this));
	}

	/**
	 * sending input message to `q.video.process` queue
	 * @param {VideoProcessMsg} payload
	 */
	async sendVideoProcessRMQMsg(payload: VideoProcessMsg) {
		await this.producerService.addToQueue('q.video.process', payload);
	}

	async search(searchVideosDto: SearchVideosDto, user: User) {
		const result = await this.videoSearchService.search(searchVideosDto.text);

		const videoIds = result.map((res) => res.id);

		if (videoIds.length == 0) return [];

		const andArr = [
			inArray(schema.videos.id, videoIds),
			eq(schema.videos.isReleased, true),
			eq(schema.videos.type, searchVideosDto.type),
		];

		if (searchVideosDto.channelId) {
			andArr.push(eq(schema.videos.channelId, searchVideosDto.channelId));
		}

		if (searchVideosDto.onlySubbed) {
			// the endpoint is public; subscriptions can only filter for a signed-in user
			if (!user) {
				throw new UnauthorizedException('Sign in to filter by subscriptions');
			}

			const subbed = await this.drizzleService.db
				.select()
				.from(schema.subscriptions)
				.where(eq(schema.subscriptions.followerId, user.currentChannelId))
				.execute();

			const subbedChannelIds = subbed.map((sub) => sub.followeeId);

			if (subbedChannelIds.length == 0) {
				return [];
			}

			andArr.push(inArray(schema.videos.channelId, subbedChannelIds));
		}

		return this.drizzleService.db.query.videos.findMany({
			where: and(...andArr),
			limit: searchVideosDto.limit,
			offset: searchVideosDto.offset,
			orderBy: [desc(schema.videos.releasedAt), desc(schema.videos.createdAt)],
			with: {
				channel: true,
				thumbnailFile: true,
				videoFile: true,
			},
		});
	}

	/**
	 * saves status and logs of process operations of messages coming from queue
	 * @param {SetVideoStatusMsg} message
	 */
	async consumeSetStatusMsg(message: SetVideoStatusMsg) {
		await this.drizzleService.db
			.update(schema.videos)
			.set({ processingStatus: message.status, ffmpegProcessLogs: message.logs })
			.where(eq(schema.videos.id, message.videoId));
	}

	/**
	 * client confirms its direct-to-storage upload completed; verifies the
	 * object exists and moves the video to ready_for_processing
	 * @param {number} id id of video
	 * @param {User} user
	 */
	async confirmUpload(id: number, user: User) {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, id),
			with: {
				channel: true,
				videoFile: true,
			},
		});

		if (!video) {
			throw new NotFoundException(`Video with id ${id} not found`);
		}

		if (video.channel.ownerId !== user.id) {
			throw new ForbiddenException(`You don't own video with id ${id}`);
		}

		if (!video.videoFile) {
			throw new BadRequestException(
				`Video with id ${id} has no file attached; request a presigned upload url first`,
			);
		}

		let stat;
		try {
			stat = await this.minioClientService.client.statObject(
				video.videoFile.bucketName,
				video.videoFile.path,
			);
		} catch (err) {
			this.logger.warn(`confirmUpload: statObject failed for video ${id}: ${err.message}`);
			throw new NotFoundException(
				`File of video with id ${id} not found in object storage; upload may not have completed`,
			);
		}

		const mimetype =
			stat.metaData?.['content-type'] ??
			stat.metaData?.['Content-Type'] ??
			'application/octet-stream';

		await this.markVideoFileUploaded(
			video.videoFile.bucketName,
			video.videoFile.path,
			stat.size,
			mimetype,
		);

		return { message: 'Upload confirmed successfully' };
	}

	/**
	 * updates file record size/mimetype and moves its video to ready_for_processing
	 * @param {string} bucketName
	 * @param {string} filePath
	 * @param {number} sizeInByte
	 * @param {string} mimetype
	 */
	async markVideoFileUploaded(
		bucketName: string,
		filePath: string,
		sizeInByte: number,
		mimetype: string,
	) {
		this.logger.debug(
			`Video file uploaded: bucketName: ${bucketName}, filePath: ${filePath}, sizeInByte=${sizeInByte}, mimetype=${mimetype}`,
		);

		const fileRecord = await this.drizzleService.db.query.files.findFirst({
			where: and(eq(schema.files.bucketName, bucketName), eq(schema.files.path, filePath)),
		});

		if (fileRecord) {
			await this.drizzleService.db
				.update(schema.files)
				.set({ sizeInByte, mimetype })
				.where(and(eq(schema.files.bucketName, bucketName), eq(schema.files.path, filePath)))
				.execute();

			await this.drizzleService.db
				.update(schema.videos)
				.set({ processingStatus: schema.VideoProccessingStatusEnum.ready_for_processing })
				.where(eq(schema.videos.videoFileId, fileRecord.id))
				.execute();

			this.logger.debug(
				`Video file uploaded: Done, bucketName: ${bucketName}, filePath: ${filePath}`,
			);
		} else {
			this.logger.warn(
				`Video file uploaded: fileRecord not found, bucketName: ${bucketName}, filePath: ${filePath}`,
			);
		}
	}

	/**
	 * checks if user owns the video
	 * @param {number} id id of video
	 * @param {User} user
	 * @throws {NotFoundException} if video not found
	 * @throws {ForbiddenException} if user does not own the video
	 * @returns {Video}
	 */
	async userOwnsVideo(id: number, user: User, tx?: TransactionType): Promise<Video> {
		const manager = tx ? tx : this.drizzleService.db;

		const video = await manager.query.videos.findFirst({
			where: eq(schema.videos.id, id),
			with: {
				channel: true,
			},
		});

		if (!video) {
			throw new NotFoundException(`Video with id ${id} not found`);
		}

		if (video.channel.ownerId !== user.id) {
			throw new ForbiddenException(`You don't own video with id ${id}`);
		}

		return video;
	}

	/**
	 * generate random 16 char ids and check if it does not exists
	 * if not it returns the newly created id
	 * @returns {string}
	 */
	async generateVideoId() {
		while (true) {
			const id = randomBytes(8).toString('hex');
			const dupVideo = await this.drizzleService.db.query.videos.findFirst({
				where: eq(schema.videos.videoId, id),
			});

			if (!dupVideo) return id;
		}
	}

	/**
	 * it would send video info such as bucket and file name and its subs into process queue
	 * @param {SendVideoToProcessQueueDto} sendVideoToProcessQueueDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async sendVideoInProcessQueue(
		sendVideoToProcessQueueDto: SendVideoToProcessQueueDto,
		user: User,
	): Promise<{ message: string }> {
		await this.userOwnsVideo(sendVideoToProcessQueueDto.id, user);

		const video = await this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, sendVideoToProcessQueueDto.id),
			with: {
				videoFile: true,
				subtitles: {
					with: {
						file: true,
					},
				},
			},
		});

		if (video.processingStatus != schema.VideoProccessingStatusEnum.ready_for_processing) {
			throw new BadRequestException(
				`Video is not in ready_for_processing state, current state: ${video.processingStatus}`,
			);
		}

		await this.sendVideoProcessRMQMsg({
			videoId: video.id,
			fileId: video.videoFile.id,
			bucketName: video.videoFile.bucketName,
			filePath: video.videoFile.path,
			sizeInByte: video.videoFile.sizeInByte,
			mimetype: video.videoFile.mimetype,
			subs: video.subtitles.map((sub) => {
				return {
					id: sub.id,
					langRFC5646: sub.langRFC5646,
					fileId: sub.file.id,
					filePath: sub.file.path,
					bucketName: sub.file.bucketName,
					sizeInByte: sub.file.sizeInByte,
					mimetype: sub.file.mimetype,
				};
			}),
		});

		await this.drizzleService.db
			.update(schema.videos)
			.set({
				processingStatus: schema.VideoProccessingStatusEnum.waiting_in_queue,
			})
			.where(eq(schema.videos.id, sendVideoToProcessQueueDto.id))
			.execute();

		return {
			message: 'Video sent to process queue successfully',
		};
	}

	/**
	 * get all videos with specified filters from owned channels
	 * @param {GetVideosDto} getVideosDto
	 * @param {User} user
	 * @returns {Video[]}
	 */
	async getAllVideosOfMyChannel(getVideosDto: GetVideosDto, @GetUser() user: User) {
		console.log(getVideosDto);

		const andArr = [eq(schema.videos.type, getVideosDto.type)];

		if (getVideosDto.channelId) {
			andArr.push(eq(schema.videos.channelId, getVideosDto.channelId));
		}

		const owned = await this.drizzleService.db
			.select()
			.from(schema.channels)
			.where(eq(schema.channels.ownerId, user.id))
			.execute();

		const ownedChannelIds = owned.map((channel) => channel.id);

		andArr.push(inArray(schema.videos.channelId, ownedChannelIds));

		return this.drizzleService.db.query.videos.findMany({
			where: and(...andArr),
			limit: getVideosDto.limit,
			offset: getVideosDto.offset,
			orderBy: [desc(schema.videos.releasedAt), desc(schema.videos.createdAt)],
			with: {
				channel: true,
				thumbnailFile: true,
				videoFile: true,
			},
		});
	}

	/**
	 * get all videos with specified filters
	 * @param {GetVideosDto} getVideosDto
	 * @param {User} user
	 * @returns {Video[]}
	 */
	async getAllVideos(getVideosDto: GetVideosDto, @GetUser() user: User) {
		const andArr = [eq(schema.videos.isReleased, true), eq(schema.videos.type, getVideosDto.type)];

		if (getVideosDto.channelId) {
			andArr.push(eq(schema.videos.channelId, getVideosDto.channelId));
		}

		if (getVideosDto.onlySubbed) {
			// the endpoint is public; subscriptions can only filter for a signed-in user
			if (!user) {
				throw new UnauthorizedException('Sign in to filter by subscriptions');
			}

			const subbed = await this.drizzleService.db
				.select()
				.from(schema.subscriptions)
				.where(eq(schema.subscriptions.followerId, user.currentChannelId))
				.execute();

			const subbedChannelIds = subbed.map((sub) => sub.followeeId);

			if (subbedChannelIds.length == 0) {
				return [];
			}

			andArr.push(inArray(schema.videos.channelId, subbedChannelIds));
		}

		return this.drizzleService.db.query.videos.findMany({
			where: and(...andArr),
			limit: getVideosDto.limit,
			offset: getVideosDto.offset,
			orderBy: [desc(schema.videos.releasedAt), desc(schema.videos.createdAt)],
			with: {
				channel: true,
				thumbnailFile: true,
				videoFile: true,
			},
		});
	}

	/**
	 * this method set a video to released
	 * @param {number} id id of video
	 * @param {User} user currently logged in user
	 * @returns {{ message: string }}
	 */
	async releaseVideo(id: number, user: User): Promise<{ message: string }> {
		const video = await this.userOwnsVideo(id, user);

		if (video.processingStatus != schema.VideoProccessingStatusEnum.done) {
			throw new ForbiddenException('Video status is not set to done');
		}

		const { ...returningKeys } = videosTableColumns;

		const releaseDate = new Date();
		const updatedVideos = await this.drizzleService.db
			.update(schema.videos)
			.set({ isReleased: true, releasedAt: releaseDate })
			.where(eq(schema.videos.id, id))
			.returning(returningKeys)
			.execute();

		const updatedVideo = updatedVideos[0];

		// reindex the full document: a partial body would REPLACE the es doc
		// and clobber the searchable name/description
		await this.updateIndexVideo(updatedVideo.id);

		return {
			message: 'Video released successfully',
		};
	}

	/**
	 * creates a video
	 * @param {CreateVideoDto} createVideoDto
	 * @param {User} user
	 * @returns {Video}
	 */
	async createVideo(
		createVideoDto: CreateVideoDto,
		user: User,
		tx?: TransactionType,
	): Promise<Video> {
		const manager = tx ? tx : this.drizzleService.db;
		await this.channelService.userOwnsChannel(createVideoDto.channelId, user, tx);

		const videoId = await this.generateVideoId();

		const { ...returningKeys } = videosTableColumns;
		const videoRes = await manager
			.insert(schema.videos)
			.values({
				...createVideoDto,
				videoId,
				processingStatus:
					createVideoDto.type === schema.videoTypeEnum.vod
						? schema.VideoProccessingStatusEnum.ready_for_upload
						: schema.VideoProccessingStatusEnum.ready_for_processing,
			})
			.returning(returningKeys)
			.execute();

		const video = videoRes[0];

		if (createVideoDto.tagIds && createVideoDto.tagIds.length > 0) {
			await this.tagService.addTagsToVideo(
				{
					tagIds: createVideoDto.tagIds,
					videoId: video.id,
				},
				user,
				tx,
			);
		}

		await this.videoSearchService.indexVideo({
			id: video.id,
			name: video.name,
			description: video.description,
		});

		return video;
	}

	/**
	 * uploads and creates an image file, then sets it as thumbnail for video
	 * @param {SetVideoThumbnailDto} setVideoThumbnailDto
	 * @param {User} user
	 * @param {Express.Multer.File} thumbnail uploaded image
	 * @returns {File}
	 */
	async setVideoThumbnail(
		setVideoThumbnailDto: SetVideoThumbnailDto,
		user: User,
		thumbnail: Express.Multer.File,
	): Promise<File> {
		await this.userOwnsVideo(setVideoThumbnailDto.id, user);

		const file = await this.fileService.uploadAndCreateFileRecord(
			thumbnail,
			'',
			'videothumbnails',
			user,
		);

		const videoUpdateRes = await this.drizzleService.db
			.update(schema.videos)
			.set({
				thumbnailFileId: file.id,
			})
			.where(eq(schema.videos.id, setVideoThumbnailDto.id))
			.execute();

		return file;
	}

	/**
	 * updates a video
	 * @param {UpdateVideoDto} updateVideoDto
	 * @param {User} user
	 * @returns {Video}
	 */
	async updateVideo(updateVideoDto: UpdateVideoDto, user: User): Promise<Video> {
		await this.userOwnsVideo(updateVideoDto.id, user);

		const { ...returningKeys } = videosTableColumns;
		const updatedVideos = await this.drizzleService.db
			.update(schema.videos)
			.set({
				...updateVideoDto,
			})
			.where(eq(schema.videos.id, updateVideoDto.id))
			.returning(returningKeys)
			.execute();

		const updatedVideo = updatedVideos[0];

		await this.videoSearchService.indexVideo({
			id: updatedVideo.id,
			name: updatedVideo.name,
			description: updatedVideo.description,
		});

		return updatedVideo;
	}

	/**
	 * add a video watched by your channel to watched playlist
	 * @param {LikeDislikeVideoDto} likeDislikeVideoDto
	 * @param {User} user
	 * @param {TransactionType} tx[]
	 */
	async watchedVideo(watchedVideoDto: WatchedVideoDto, user: User, tx?: TransactionType) {
		const manager = tx ? tx : this.drizzleService.db;

		const playlistOfChannel = await this.playlistService.getPlaylistsOfChannel(
			watchedVideoDto.watcherChannelId,
		);

		const watchPlaylist = playlistOfChannel.find(
			(playlist) => playlist.type == schema.PlaylistTypeEnum.watched,
		);

		if (!watchPlaylist) {
			throw new BadRequestException('Watched playlist for your channel does not exists');
		}

		await this.playlistService.addVideos(
			{
				videoIds: [watchedVideoDto.videoId],
				playlistId: watchPlaylist.id,
			},
			user,
			tx,
		);

		await manager
			.update(schema.videos)
			.set({
				numberOfVisits: sql`${schema.videos.numberOfVisits} + 1`,
			})
			.where(eq(schema.videos.id, watchedVideoDto.videoId))
			.execute();

		return {
			message: 'Operation done successfully.',
		};
	}

	/**
	 * Like or dislike a video by your channel
	 * @param {LikeDislikeVideoDto} likeDislikeVideoDto
	 * @param {User} user
	 * @param {TransactionType} tx[]
	 */
	async likeDislikeVideo(
		likeDislikeVideoDto: LikeDislikeVideoDto,
		user: User,
		tx?: TransactionType,
	) {
		const manager = tx ? tx : this.drizzleService.db;

		const playlistOfChannel = await this.playlistService.getPlaylistsOfChannel(
			likeDislikeVideoDto.likerChannelId,
		);

		if (likeDislikeVideoDto.type == ILikeType.like) {
			const likePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.likes,
			);

			if (!likePlaylist) {
				throw new BadRequestException('Like playlist for your channel does not exists');
			}

			await this.playlistService.addVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: likePlaylist.id,
				},
				user,
				tx,
			);

			await manager
				.update(schema.videos)
				.set({
					numberOfLikes: sql`${schema.videos.numberOfLikes} + 1`,
				})
				.where(eq(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		} else if (likeDislikeVideoDto.type == ILikeType.dislike) {
			const dislikePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.dislikes,
			);

			if (!dislikePlaylist) {
				throw new BadRequestException('Dislike playlist for your channel does not exists');
			}

			await this.playlistService.addVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: dislikePlaylist.id,
				},
				user,
				tx,
			);

			await manager
				.update(schema.videos)
				.set({
					numberOfDislikes: sql`${schema.videos.numberOfDislikes} + 1`,
				})
				.where(eq(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		} else if (likeDislikeVideoDto.type == ILikeType.unlike) {
			const likePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.likes,
			);

			if (!likePlaylist) {
				throw new BadRequestException('Like playlist for your channel does not exists');
			}

			await this.playlistService.removeVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: likePlaylist.id,
				},
				user,
				tx,
			);

			await manager
				.update(schema.videos)
				.set({
					numberOfLikes: sql`${schema.videos.numberOfLikes} - 1`,
				})
				.where(eq(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		} else if (likeDislikeVideoDto.type == ILikeType.undislike) {
			const dislikePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.dislikes,
			);

			if (!dislikePlaylist) {
				throw new BadRequestException('Like playlist for your channel does not exists');
			}

			await this.playlistService.removeVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: dislikePlaylist.id,
				},
				user,
				tx,
			);

			await manager
				.update(schema.videos)
				.set({
					numberOfDislikes: sql`${schema.videos.numberOfDislikes} - 1`,
				})
				.where(eq(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		}

		return {
			message: 'Operation done successfully.',
		};
	}

	/**
	 * fetches a video with subs by video id; unreleased videos are only
	 * served to the owner of their channel, everyone else gets a
	 * NotFound so unreleased videos' existence stays hidden
	 * @param {string} videoId
	 * @param {User} user requesting user, undefined when anonymous
	 * @returns {Video}
	 */
	async getVideoByVideoId(videoId: string, user?: User): Promise<Video> {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.videoId, videoId),
			with: {
				videosToTags: {
					with: {
						tag: true,
					},
				},
				subtitles: true,
				videoFile: true,
				thumbnailFile: true,
				comments: {
					with: {
						owner: {
							with: {
								avatar: true,
							},
						},
					},
				},
				channel: {
					with: {
						avatar: true,
					},
				},
			},
		});

		if (!video || (!video.isReleased && video.channel.ownerId !== user?.id)) {
			throw new NotFoundException(`Video with videoId ${videoId} not found`);
		}

		return video;
	}

	/**
	 * reconnect grace window in seconds (LIVE_RESUME_GRACE_SECONDS, default 300)
	 * @returns {number}
	 */
	liveResumeGraceSeconds(): number {
		return Number(this.configService.get('LIVE_RESUME_GRACE_SECONDS') ?? 300);
	}

	/**
	 * finds a video record with type of live and passed videoId; inactive rows
	 * still match while their disconnect is inside the resume grace window,
	 * so a reconnecting encoder and the watch page can find them
	 * @param {string} videoId
	 * @returns {Promise<Video | LiveVideoStatePayload | undefined>}
	 */
	async getLiveByVideoId(videoId: string) {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: and(
				eq(schema.videos.videoId, videoId),
				eq(schema.videos.type, schema.videoTypeEnum.live),
				or(
					eq(schema.videos.isActive, true),
					gt(
						schema.videos.disconnectedAt,
						sql`now() - make_interval(secs => ${this.liveResumeGraceSeconds()})`,
					),
				),
			),
		});

		return video != null ? this.withLiveState(video) : video;
	}

	/**
	 * adds the live-stream fields to a live video payload; vod videos pass
	 * through unchanged
	 * @param {Video} video
	 * @returns {Video | LiveVideoStatePayload}
	 */
	private withLiveState(video: Video): Video | LiveVideoStatePayload {
		if (video.type != schema.videoTypeEnum.live) {
			return video;
		}

		const withinGrace =
			!!video.disconnectedAt &&
			video.disconnectedAt.getTime() > Date.now() - this.liveResumeGraceSeconds() * 1000;

		return {
			...video,
			liveState: video.isActive ? 'live' : withinGrace ? 'reconnecting' : 'ended',
			liveStartedAt: video.liveStartedAt?.toISOString() ?? null,
			disconnectedAt: video.disconnectedAt?.toISOString() ?? null,
		};
	}

	/**
	 * creates and saves a presigned put url for video upload and returns it
	 * @param {GetVideoPresignedPutURLDto} getVideoPresignedPutURLDto
	 * @param {User} user
	 * @returns {{ url: string, fileRecord: File }}
	 */
	async getPresignedPutURL(
		getVideoPresignedPutURLDto: GetVideoPresignedPutURLDto,
		user: User,
	): Promise<{ url: string; fileRecord: File }> {
		const { url, fileRecord } = await this.fileService.getPresignedPutURL(
			{
				bucket: 'videos',
				path: getVideoPresignedPutURLDto.path,
			},
			user,
		);

		await this.drizzleService.db
			.update(schema.videos)
			.set({ videoFileId: fileRecord.id })
			.where(eq(schema.videos.id, getVideoPresignedPutURLDto.id))
			.execute();

		return {
			url,
			fileRecord,
		};
	}

	/**
	 * fetches video with subs by id; unreleased videos are only
	 * served to the owner of their channel, everyone else gets a
	 * NotFound so unreleased videos' existence stays hidden
	 * @param {number} id
	 * @param {User} user requesting user, undefined when anonymous
	 * @returns {Promise<Video | LiveVideoStatePayload>}
	 */
	async getVideoById(id: number, user?: User): Promise<Video | LiveVideoStatePayload> {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, id),
			with: {
				videosToTags: {
					with: {
						tag: true,
					},
				},
				subtitles: true,
				videoFile: true,
				thumbnailFile: true,
				comments: {
					with: {
						owner: {
							with: {
								avatar: true,
							},
						},
					},
				},
				channel: {
					with: {
						avatar: true,
					},
				},
			},
		});

		// same NotFound for missing and unreleased: existence of unpublished
		// videos must not be confirmable by strangers
		if (!video || (!video.isReleased && video.channel.ownerId !== user?.id)) {
			throw new NotFoundException(`Video with id ${id} not found`);
		}

		return this.withLiveState(video);
	}

	/**
	 * deletes a video
	 * @param {DeleteVideoDto} deleteVideoDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async deleteVideo(
		deleteVideoDto: DeleteVideoDto,
		@GetUser() user: User,
	): Promise<{ message: string }> {
		await this.userOwnsVideo(deleteVideoDto.id, user);

		await this.drizzleService.db
			.update(schema.videos)
			.set({ isActive: false, deletedAt: new Date() })
			.where(eq(schema.videos.id, deleteVideoDto.id));

		await this.videoSearchService.deleteIndexVideo(deleteVideoDto.id);

		return {
			message: 'Video Deleted Successfully',
		};
	}

	async updateIndexVideo(videoId: number, tx?: TransactionType) {
		const manager = tx ? tx : this.drizzleService.db;

		const video = await manager.query.videos.findFirst({
			where: eq(schema.videos.id, videoId),
		});

		await this.videoSearchService.indexVideo({
			id: video.id,
			name: video.name,
			description: video.description,
		});
	}
}
