import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class RemoveTagFromVideoDto {
	@IsInt()
	@Type(() => Number)
	videoId: number;

	@IsInt()
	@Type(() => Number)
	tagId: number;
}
