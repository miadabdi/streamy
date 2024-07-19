import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { TVideoTypeEnum, videoTypeEnum } from '../../drizzle/schema';

export class GetVideosDto {
	@IsOptional()
	@IsInt()
	@Type(() => Number)
	offset: number = 0;

	@IsOptional()
	@IsInt()
	@Type(() => Number)
	limit: number = 10;

	@IsOptional()
	@IsInt()
	@Type(() => Number)
	channelId: number;

	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	includeNotReleased: boolean = false;

	@IsOptional()
	@IsBoolean()
	@Type(() => Boolean)
	onlySubbed: boolean;

	@IsOptional()
	@IsEnum(videoTypeEnum)
	type: TVideoTypeEnum = videoTypeEnum.vod;
}
