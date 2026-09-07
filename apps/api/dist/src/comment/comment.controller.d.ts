import { User } from '../drizzle/schema';
import { CommentService } from './comment.service';
import { CreateCommentDto, DeleteCommentDto, GetCommentByIdDto, UpdateCommentDto } from './dto';
export declare class CommentController {
	private commentService;
	constructor(commentService: CommentService);
	createComment(
		createCommentDto: CreateCommentDto,
		user: User,
	): Promise<{
		id: number;
		videoId: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		ownerId: number;
		isEdited: boolean;
		replyTo: number;
		content: string;
	}>;
	updateComment(
		updateCommentDto: UpdateCommentDto,
		user: User,
	): Promise<{
		id: number;
		videoId: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		ownerId: number;
		isEdited: boolean;
		replyTo: number;
		content: string;
	}>;
	getCommentById(
		getCommentByIdDto: GetCommentByIdDto,
		user: User,
	): Promise<{
		id: number;
		videoId: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		ownerId: number;
		isEdited: boolean;
		replyTo: number;
		content: string;
	}>;
	deleteComment(
		deleteCommentDto: DeleteCommentDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
