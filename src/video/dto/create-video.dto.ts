import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString, Length } from 'class-validator';
import { TVideoTypeEnum, videoTypeEnum } from '../../drizzle/schema';

export class CreateVideoDto {
	@IsString()
	@Length(3, 256)
	name: string;

	@IsString()
	@Length(8, 2048)
	description: string;

	@IsInt()
	@Type(() => Number)
	channelId: number;

	@IsEnum(videoTypeEnum)
	type: TVideoTypeEnum;
}
