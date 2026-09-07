import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Default } from '../../common/decorators/default-value.decorator';
import { TVideoTypeEnum, videoTypeEnum } from '../../drizzle/schema';

export class CreateVideoDto {
	@IsString()
	@Length(3, 255)
	name: string;

	@IsString()
	@Length(8, 2048)
	description: string;

	@IsInt()
	@Type(() => Number)
	channelId: number;

	@IsEnum(videoTypeEnum)
	type: TVideoTypeEnum;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Default([])
	tagIds: number[];
}
