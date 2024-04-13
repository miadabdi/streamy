import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { videosTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { CreateVideoDto, DeleteVideoDto, SetVideoThumbnailDto, UpdateVideoDto } from './dto';

@Injectable()
export class VideoService {
	private logger = new Logger(VideoService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
	) {}

	async userOwnsChannel(id: number, user: User) {
		const channel = await this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, id),
		});

		if (!channel) {
			throw new NotFoundException('Channel not found');
		}

		if (channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this channel");
		}
	}

	async userOwnsVideo(id: number, user: User) {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, id),
			with: {
				channel: true,
			},
		});

		if (!video) {
			throw new NotFoundException('Video not found');
		}

		if (video.channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this video");
		}
	}

	async generateVideoId() {
		while (true) {
			const id = randomBytes(8).toString('hex');
			const dupVideo = await this.drizzleService.db.query.videos.findFirst({
				where: eq(schema.videos.videoId, id),
			});

			if (!dupVideo) return id;
		}
	}

	async createVideo(createVideoDto: CreateVideoDto, user: User) {
		await this.userOwnsChannel(createVideoDto.channelId, user);

		const videoId = await this.generateVideoId();

		const { ...returningKeys } = videosTableColumns;
		const video = await this.drizzleService.db
			.insert(schema.videos)
			.values({
				...createVideoDto,
				videoId,
				processingStatus: schema.VideoProccessingStatusEnum.ready_for_upload,
			})
			.returning(returningKeys)
			.execute();

		return video[0];
	}

	async setVideoThumbnail(
		setVideoThumbnailDto: SetVideoThumbnailDto,
		user: User,
		thumbnail: Express.Multer.File,
	) {
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

	async updateVideo(updateVideoDto: UpdateVideoDto, user: User) {
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

	async getVideoByVideoId(videoId: string) {
		return this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.videoId, videoId),
			with: {
				subtitles: true,
			},
		});
	}

	async getVideoById(id: number) {
		return this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, id),
			with: {
				subtitles: true,
			},
		});
	}

	async deleteVideo(deleteVideoDto: DeleteVideoDto, @GetUser() user: User) {
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