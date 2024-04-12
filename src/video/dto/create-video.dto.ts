import { Type } from 'class-transformer';
import { IsInt, IsString, Length } from 'class-validator';

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
}
