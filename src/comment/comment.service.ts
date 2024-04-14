import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { commentsTableColumns } from '../drizzle/table-columns';
import { VideoService } from '../video/video.service';
import { CreateCommentDto, DeleteCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentService {
	private logger = new Logger(CommentService.name);

	constructor(
		private drizzleService: DrizzleService,
		private videoService: VideoService,
	) {}

	async userOwnsComment(id: number, user: User) {
		const comment = await this.drizzleService.db.query.comments.findFirst({
			where: eq(schema.comments.id, id),
		});

		if (!comment) {
			throw new NotFoundException(`Comment with id ${id} not found`);
		}

		if (comment.ownerId !== user.id) {
			throw new ForbiddenException(`You don't own comment with id ${id}`);
		}
	}

	async createComment(createCommentDto: CreateCommentDto, user: User) {
		const video = await this.videoService.getVideoById(createCommentDto.videoId);
		if (!video) {
			throw new NotFoundException(`Video with id ${createCommentDto.videoId} not found`);
		}

		if (createCommentDto.replyTo) {
			const repliedTo = await this.drizzleService.db.query.comments.findFirst({
				where: eq(schema.comments.id, createCommentDto.replyTo),
			});

			if (!repliedTo) {
				throw new NotFoundException(
					`Replied to non-existent comment with id ${createCommentDto.replyTo}`,
				);
			}
		}

		const { ...returningKeys } = commentsTableColumns;
		const comments = await this.drizzleService.db
			.insert(schema.comments)
			.values({
				...createCommentDto,
				ownerId: user.id,
			})
			.returning(returningKeys)
			.execute();

		return comments[0];
	}

	async updateComment(updateCommentDto: UpdateCommentDto, user: User) {
		await this.userOwnsComment(updateCommentDto.id, user);

		const { ...returningKeys } = commentsTableColumns;
		const updatedComment = await this.drizzleService.db
			.update(schema.comments)
			.set({
				...updateCommentDto,
			})
			.where(eq(schema.comments.id, updateCommentDto.id))
			.returning(returningKeys)
			.execute();

		return updatedComment[0];
	}

	async getCommentById(id: number) {
		return this.drizzleService.db.query.comments.findFirst({
			where: eq(schema.comments.id, id),
			with: {
				repliedTo: true,
				replies: {
					where: eq(schema.comments.isActive, true),
				},
			},
		});
	}

	async deleteComment(deleteCommentDto: DeleteCommentDto, @GetUser() user: User) {
		await this.userOwnsComment(deleteCommentDto.id, user);

		await this.drizzleService.db
			.update(schema.comments)
			.set({ isActive: false, deletedAt: new Date() })
			.where(eq(schema.comments.id, deleteCommentDto.id));

		return {
			message: 'Comment Deleted Successfully',
		};
	}
}
