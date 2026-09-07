import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateCommentDto {
	@IsString()
	@Length(3, 1024)
	content: string;

	@IsInt()
	@Type(() => Number)
	videoId: number;

	@IsOptional()
	@IsInt()
	@Type(() => Number)
	replyTo: number;

	@IsInt()
	@Type(() => Number)
	ownerId: number;
}
