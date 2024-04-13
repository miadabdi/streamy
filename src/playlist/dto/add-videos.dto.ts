import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AddVideosDto {
	@IsInt()
	@Type(() => Number)
	playlistId: number;

	@IsInt({ each: true })
	@Type(() => Number)
	videoIds: number[];
}
