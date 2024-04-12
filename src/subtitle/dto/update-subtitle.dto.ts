import { PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { CreateSubtitleDto } from './create-subtitle.dto';

export class UpdateSubtitleDto extends PickType(PartialType(CreateSubtitleDto), ['langRFC5646']) {
	@IsInt()
	@Type(() => Number)
	id: number;
}
