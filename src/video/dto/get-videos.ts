import { Transform, Type } from 'class-transformer';
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
	@Transform(({ value }) => value === 'true')
	includeNotReleased: boolean = false;

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true')
	onlySubbed: boolean = false;

	@IsOptional()
	@IsEnum(videoTypeEnum)
	type: TVideoTypeEnum = videoTypeEnum.vod;
}
