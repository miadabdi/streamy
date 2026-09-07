import { DrizzleService } from '../drizzle/drizzle.service';
import { Comment, User } from '../drizzle/schema';
import { VideoService } from '../video/video.service';
import { CreateCommentDto, DeleteCommentDto, UpdateCommentDto } from './dto';
export declare class CommentService {
	private drizzleService;
	private videoService;
	private logger;
	constructor(drizzleService: DrizzleService, videoService: VideoService);
	userOwnsComment(id: number, user: User): Promise<void>;
	createComment(createCommentDto: CreateCommentDto, user: User): Promise<Comment>;
	updateComment(updateCommentDto: UpdateCommentDto, user: User): Promise<Comment>;
	getCommentById(id: number): Promise<Comment>;
	deleteComment(
		deleteCommentDto: DeleteCommentDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
