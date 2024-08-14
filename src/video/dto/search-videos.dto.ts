import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { TVideoTypeEnum, videoTypeEnum } from '../../drizzle/schema';

export class SearchVideosDto {
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
	onlySubbed: boolean = false;

	@IsOptional()
	@IsEnum(videoTypeEnum)
	type: TVideoTypeEnum = videoTypeEnum.vod;

	@IsString()
	text: string;
}
