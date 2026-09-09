import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { RFC5646_LANGUAGE_TAGS } from '../common/constants';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { Subtitle, User } from '../drizzle/schema';
import { subtitlesTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { VideoService } from '../video/video.service';
import { CreateSubtitleDto, DeleteSubtitleDto, UpdateSubtitleDto } from './dto';

@Injectable()
export class SubtitleService {
	private logger = new Logger(SubtitleService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
		private videoService: VideoService,
	) {}

	/**
	 * checks if user owns subtitle
	 * @param {number} id id of subtitle record
	 * @param {User} user
	 * @throws {NotFoundException} subtitle with provided id is not found
	 * @throws {ForbiddenException} user does not own the subtitle
	 */
	async userOwnsSubtitle(id: number, user: User): Promise<undefined> {
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
			throw new NotFoundException(`Subtitle with id ${id} not found`);
		}

		if (subtitle.video.channel.ownerId !== user.id) {
			throw new ForbiddenException(`You don't own subtitle with id ${id}`);
		}
	}

	/**
	 * creates a subtitle
	 * @param {CreateSubtitleDto} createSubtitleDto
	 * @param {Express.Multer.File} file
	 * @param {User} user
	 * @returns {Subtitle}
	 */
	async createSubtitle(
		createSubtitleDto: CreateSubtitleDto,
		file: Express.Multer.File,
		user: User,
	): Promise<Subtitle> {
		await this.videoService.userOwnsVideo(createSubtitleDto.videoId, user);

		const fileRecord = await this.fileService.uploadAndCreateFileRecord(
			file,
			'',
			'subtitlefiles',
			user,
		);

		const { ...returningKeys } = subtitlesTableColumns;
		const subtitle = await this.drizzleService.db
			.insert(schema.subtitles)
			.values({
				videoId: createSubtitleDto.videoId,
				langRFC5646: createSubtitleDto.langRFC5646,
				fileId: fileRecord.id,
			})
			.returning(returningKeys)
			.execute();

		return subtitle[0];
	}

	/**
	 * updates a subtitle
	 * @param {UpdateSubtitleDto} updateSubtitleDto
	 * @param {User} user
	 * @returns {Subtitle}
	 */
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

	/**
	 * finds subtitles of a video and returns all of them
	 * @param {number} videoId
	 * @param {User} user requesting user, undefined when anonymous
	 * @returns {Subtitle[]}
	 * @throws {NotFoundException} video is missing or not released to the requester
	 */
	async getSubtitlesByVideoId(videoId: number, user?: User): Promise<Subtitle[]> {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: eq(schema.videos.id, videoId),
			with: {
				channel: true,
			},
		});

		// same NotFound for missing and unreleased: subtitles must not
		// confirm the existence of unpublished videos to strangers
		if (!video || (!video.isReleased && video.channel.ownerId !== user?.id)) {
			throw new NotFoundException(`Video with id ${videoId} not found`);
		}

		return this.drizzleService.db.query.subtitles.findMany({
			where: eq(schema.subtitles.videoId, videoId),
			with: {
				video: true,
			},
		});
	}

	/**
	 * finds language name of a RFC5646 identifier
	 * @param {string} identifier
	 * @returns {{ language: string }}
	 */
	getLanguageOfRFC5646(identifier: string): { language: string } {
		return {
			language: RFC5646_LANGUAGE_TAGS[identifier],
		};
	}

	/**
	 * finds a subtitle by id; subtitles of unreleased videos are only
	 * served to the owner of the video's channel
	 * @param {number} id id of subtitle record
	 * @param {User} user
	 * @returns {Subtitle}
	 * @throws {NotFoundException} subtitle is missing or its video is unreleased to the requester
	 */
	async getSubtitleById(id: number, user: User): Promise<Subtitle> {
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

		// same NotFound for missing and unreleased: mirrors getSubtitlesByVideoId
		if (!subtitle || (!subtitle.video.isReleased && subtitle.video.channel.ownerId !== user.id)) {
			throw new NotFoundException(`Subtitle with id ${id} not found`);
		}

		return this.drizzleService.db.query.subtitles.findFirst({
			where: eq(schema.subtitles.id, id),
			with: {
				video: true,
			},
		});
	}

	/**
	 * deletes a subtitle
	 * @param {DeleteSubtitleDto} deleteSubtitleDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async deleteSubtitle(
		deleteSubtitleDto: DeleteSubtitleDto,
		@GetUser() user: User,
	): Promise<{ message: string }> {
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
