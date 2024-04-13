import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { CreatePlaylistDto } from './create-playlist.dto';

export class UpdatePlaylistDto extends OmitType(PartialType(CreatePlaylistDto), ['channelId']) {
	@IsInt()
	@Type(() => Number)
	id: number;
}
