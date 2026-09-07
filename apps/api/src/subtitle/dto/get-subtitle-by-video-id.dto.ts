import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetSubtitleByVideoIdDto {
	@IsInt()
	@Type(() => Number)
	videoId: number;
}
