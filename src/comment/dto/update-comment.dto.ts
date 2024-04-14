import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { CreateCommentDto } from './create-comment.dto';

export class UpdateCommentDto extends OmitType(PartialType(CreateCommentDto), [
	'videoId',
	'replyTo',
]) {
	@IsInt()
	@Type(() => Number)
	id: number;
}
