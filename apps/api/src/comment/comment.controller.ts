import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { User } from '../drizzle/schema';
import { CommentService } from './comment.service';
import { CreateCommentDto, DeleteCommentDto, GetCommentByIdDto, UpdateCommentDto } from './dto';

@Controller('/comment')
@UseGuards(JwtAuthGuard)
export class CommentController {
	constructor(private commentService: CommentService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createComment(@Body() createCommentDto: CreateCommentDto, @GetUser() user: User) {
		return this.commentService.createComment(createCommentDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch()
	updateComment(@Body() updateCommentDto: UpdateCommentDto, @GetUser() user: User) {
		return this.commentService.updateComment(updateCommentDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-id')
	getCommentById(@Query() getCommentByIdDto: GetCommentByIdDto, @GetUser() user: User) {
		return this.commentService.getCommentById(getCommentByIdDto.id);
	}

	@HttpCode(HttpStatus.OK)
	@Delete()
	deleteComment(@Query() deleteCommentDto: DeleteCommentDto, @GetUser() user: User) {
		return this.commentService.deleteComment(deleteCommentDto, user);
	}
}
