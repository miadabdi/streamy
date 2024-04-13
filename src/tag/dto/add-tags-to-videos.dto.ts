import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AddTagsToVideoDto {
	@IsInt()
	@Type(() => Number)
	videoId: number;

	@IsInt({ each: true })
	@Type(() => Number)
	tagIds: number[];
}
