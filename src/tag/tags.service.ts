import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { Tag, User } from '../drizzle/schema';
import { tagsTableColumns } from '../drizzle/table-columns';
import { VideoService } from '../video/video.service';
import { CreateTagDto, DeleteTagDto } from './dto';
import { AddTagsToVideoDto } from './dto/add-tags-to-videos.dto';

@Injectable()
export class TagService {
	private logger = new Logger(TagService.name);

	constructor(
		private drizzleService: DrizzleService,
		private videoService: VideoService,
	) {}

	/**
	 * creates a tag
	 * @param {CreateTagDto} createTagDto
	 * @param {User} user
	 * @returns {Tag}
	 */
	async createTag(createTagDto: CreateTagDto, user: User): Promise<Tag> {
		// TODO: check for admin access

		const dupTag = await this.drizzleService.db.query.tags.findFirst({
			where: eq(schema.tags.title, createTagDto.title),
		});

		if (dupTag) {
			throw new ConflictException('Tag already exists');
		}

		const { ...returningKeys } = tagsTableColumns;
		const tags = await this.drizzleService.db
			.insert(schema.tags)
			.values({
				...createTagDto,
			})
			.returning(returningKeys)
			.execute();

		return tags[0];
	}

	/**
	 * adds a tag to the tags list of a video owned by logged in user
	 * @param {AddTagsToVideoDto} addTagsToVideoDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async addTagsToVideo(
		addTagsToVideoDto: AddTagsToVideoDto,
		user: User,
	): Promise<{ message: string }> {
		await this.videoService.userOwnsVideo(addTagsToVideoDto.videoId, user);

		const tagIdsUnique = [...new Set(addTagsToVideoDto.tagIds)];

		const tags = await this.drizzleService.db.query.tags.findMany({
			where: and(inArray(schema.tags.id, tagIdsUnique), eq(schema.tags.isActive, true)),
		});

		for (const tagId of tagIdsUnique) {
			const tag = tags.find((tag) => tag.id == tagId);
			if (!tag) {
				throw new NotFoundException(`Tag with id ${tagId} not found`);
			}
		}

		const values = addTagsToVideoDto.tagIds.map((tagId) => {
			return {
				tagId,
				videoId: addTagsToVideoDto.videoId,
			};
		});
		await this.drizzleService.db
			.insert(schema.tagsVideos)
			.values(values)
			.onConflictDoNothing()
			.execute();

		return {
			message: 'Tags were added to the video',
		};
	}

	/**
	 * finds a tag by id and returns it if found
	 * @param {number} id
	 * @returns {Tag}
	 */
	async getTagById(id: number): Promise<Tag> {
		return this.drizzleService.db.query.tags.findFirst({
			where: eq(schema.tags.id, id),
		});
	}

	/**
	 * deletes a tag
	 * @param {DeleteTagDto} deleteTagDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async deleteTag(deleteTagDto: DeleteTagDto, @GetUser() user: User): Promise<{ message: string }> {
		// TODO: check for admin access

		await this.drizzleService.db
			.update(schema.tags)
			.set({ isActive: false, deletedAt: new Date() })
			.where(eq(schema.tags.id, deleteTagDto.id));

		return {
			message: 'Tag Deleted Successfully',
		};
	}
}
