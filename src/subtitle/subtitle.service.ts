import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { RFC5646_LANGUAGE_TAGS } from '../common/constants';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { subtitlesTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { CreateSubtitleDto, DeleteSubtitleDto, UpdateSubtitleDto } from './dto';

@Injectable()
export class SubtitleService {
	private logger = new Logger(SubtitleService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
	) {}

	async userOwnsSubtitle(id: number, user: User) {
		const subtitle = await this.drizzleService.db.query.subtitles.findFirst({
			where: eq(schema.subtitles.id, id),
			with: {
				video: {
					with: {
						channel: true,
					},
				},
			},
		});

		if (!subtitle) {
			throw new NotFoundException('Subtitle not found');
		}

		if (subtitle.video.channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this subtitle");
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

	async createSubtitle(
		createSubtitleDto: CreateSubtitleDto,
		file: Express.Multer.File,
		user: User,
	) {
		await this.userOwnsVideo(createSubtitleDto.videoId, user);

		const fileRecord = await this.fileService.uploadAndCreateFileRecord(
			file,
			'',
			'subtitlefiles',
			user,
		);

		createSubtitleDto.fileId = fileRecord.id;

		const { ...returningKeys } = subtitlesTableColumns;
		const subtitle = await this.drizzleService.db
			.insert(schema.subtitles)
			.values({
				...createSubtitleDto,
			})
			.returning(returningKeys)
			.execute();

		return subtitle[0];
	}

	async updateSubtitle(updateSubtitleDto: UpdateSubtitleDto, user: User) {
		await this.userOwnsSubtitle(updateSubtitleDto.id, user);

		const { ...returningKeys } = subtitlesTableColumns;
		const updatedSubtitle = await this.drizzleService.db
			.update(schema.subtitles)
			.set({
				...updateSubtitleDto,
			})
			.where(eq(schema.subtitles.id, updateSubtitleDto.id))
			.returning(returningKeys)
			.execute();

		return updatedSubtitle[0];
	}

	async getSubtitleByVideoId(videoId: number) {
		return this.drizzleService.db.query.subtitles.findFirst({
			where: eq(schema.subtitles.videoId, videoId),
			with: {
				video: true,
			},
		});
	}

	getLanguageOfRFC5646(identifier: string, @GetUser() user: User) {
		return {
			language: RFC5646_LANGUAGE_TAGS[identifier],
		};
	}

	async getSubtitleById(id: number) {
		const subtitle = await this.drizzleService.db.query.subtitles.findFirst({
			where: eq(schema.subtitles.id, id),
			with: {
				video: true,
			},
		});

		return subtitle;
	}

	async deleteSubtitle(deleteSubtitleDto: DeleteSubtitleDto, @GetUser() user: User) {
		await this.userOwnsSubtitle(deleteSubtitleDto.id, user);

		await this.drizzleService.db
			.update(schema.subtitles)
			.set({ isActive: false, deletedAt: new Date() })
			.where(eq(schema.subtitles.id, deleteSubtitleDto.id));

		return {
			message: 'Subtitle Deleted Successfully',
		};
	}
}
