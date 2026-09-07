import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class WatchedVideoDto {
	@IsInt()
	@Type(() => Number)
	videoId: number;

	@IsInt()
	@Type(() => Number)
	watcherChannelId: number;
}
