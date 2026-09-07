import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { CreateVideoDto } from './create-video.dto';

export class UpdateVideoDto extends OmitType(PartialType(CreateVideoDto), ['channelId']) {
	@IsInt()
	@Type(() => Number)
	id: number;
}
