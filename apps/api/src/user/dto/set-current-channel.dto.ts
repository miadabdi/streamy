import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SetCurrentChannelDto {
	@IsInt()
	@Type(() => Number)
	currentChannelId: number;
}
