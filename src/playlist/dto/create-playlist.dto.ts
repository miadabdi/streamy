import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import {
	PlaylistPrivacyEnum,
	PlaylistTypeEnum,
	TPlaylistPrivacyEnum,
	TPlaylistTypeEnum,
} from '../../drizzle/schema';

export class CreatePlaylistDto {
	@IsString()
	@Length(3, 256)
	name: string;

	@IsString()
	@Length(8, 2048)
	description: string;

	@IsInt()
	@Type(() => Number)
	channelId: number;

	@IsOptional()
	@IsEnum(PlaylistPrivacyEnum)
	privacy?: TPlaylistPrivacyEnum;

	@IsOptional()
	@IsEnum(PlaylistTypeEnum)
	type?: TPlaylistTypeEnum;
}
