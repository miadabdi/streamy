import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
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

	async createTag(createTagDto: CreateTagDto, user: User) {
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

	async addTagsToVideo(addTagsToVideoDto: AddTagsToVideoDto, user: User) {
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

	async getTagById(id: number) {
		return this.drizzleService.db.query.tags.findFirst({
			where: eq(schema.tags.id, id),
		});
	}

	async deleteTag(deleteTagDto: DeleteTagDto, @GetUser() user: User) {
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
