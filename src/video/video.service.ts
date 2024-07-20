import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
import { GetUser } from '../common/decorators';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { File, User, Video } from '../drizzle/schema';
import { videosTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
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
import { SetVideoStatusMsg } from './interface';
import { VideoProcessMsg } from './interface/video-process-msg.interface';

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
	 * whenever a new video is uploaded into minio, it would fire an event,
	 * we capture the event and update related file record and video record
	 * @param {*} record
	 */
	async handleVideoUploadEvent(record: any) {
		const bucketName = record.s3.bucket.name;
		const filePath = record.s3.object.key;
		const sizeInByte = record.s3.object.size;
		const mimetype = record.s3.object.contentType;

		this.logger.debug(
			`Video upload event: bucketName: ${bucketName}, filePath: ${filePath}, sizeInByte=${sizeInByte}, mimetype=${mimetype}`,
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
				`Video upload event: Done, bucketName: ${bucketName}, filePath: ${filePath}`,
			);
		} else {
			this.logger.debug(
				`Video upload event: fileRecord not found, bucketName: ${bucketName}, filePath: ${filePath}`,
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
	 * get all videos with specified filters
	 * @param {GetVideosDto} getVideosDto
	 * @param {User} user
	 * @returns {Video[]}
	 */
	async getAllVideos(getVideosDto: GetVideosDto, @GetUser() user: User) {
		console.log(getVideosDto);

		const andArr = [eq(schema.videos.type, getVideosDto.type)];

		if (getVideosDto.channelId) {
			andArr.push(eq(schema.videos.channelId, getVideosDto.channelId));
		}

		if (getVideosDto.includeNotReleased) {
			// if user wants to get not released videos it should only see unreleased videos of their channel
			const owned = await this.drizzleService.db
				.select()
				.from(schema.channels)
				.where(eq(schema.channels.ownerId, user.id))
				.execute();

			const ownedChannelIds = owned.map((channel) => channel.id);

			andArr.push(
				or(eq(schema.videos.isReleased, true), inArray(schema.videos.channelId, ownedChannelIds)),
			);
		} else {
			andArr.push(eq(schema.videos.isReleased, true));
		}

		if (getVideosDto.onlySubbed) {
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

		await this.drizzleService.db
			.update(schema.videos)
			.set({ isReleased: true, releasedAt: new Date() })
			.execute();

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
		const updatedVideo = await this.drizzleService.db
			.update(schema.videos)
			.set({
				...updateVideoDto,
			})
			.where(eq(schema.videos.id, updateVideoDto.id))
			.returning(returningKeys)
			.execute();

		return updatedVideo[0];
	}

	/**
	 * fetches a video with subs by video id
	 * @param {number} videoId
	 * @returns {Video}
	 */
	async getVideoByVideoId(videoId: string): Promise<Video> {
		return this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.videoId, videoId),
			with: {
				subtitles: true,
				videoFile: true,
				thumbnailFile: true,
				comments: true,
			},
		});
	}

	/**
	 * finds a video record with type of live and passed videoId
	 * @param {string} videoId
	 * @returns {Video}
	 */
	getLiveByVideoId(videoId: string) {
		return this.drizzleService.db.query.videos.findFirst({
			where: and(
				eq(schema.videos.videoId, videoId),
				eq(schema.videos.type, schema.videoTypeEnum.live),
				eq(schema.videos.isActive, true),
			),
		});
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
	 * fetches video with subs by id
	 * @param {number} id
	 * @returns {Video}
	 */
	async getVideoById(id: number): Promise<Video> {
		return this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, id),
			with: {
				subtitles: true,
				videoFile: true,
				thumbnailFile: true,
				comments: true,
			},
		});
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

		return {
			message: 'Video Deleted Successfully',
		};
	}
}
