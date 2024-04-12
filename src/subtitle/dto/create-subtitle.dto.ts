import { Type } from 'class-transformer';
import { IsInt, IsString, Length } from 'class-validator';

export class CreateSubtitleDto {
	@IsString()
	@Length(3, 256)
	langRFC5646: string;

	@IsInt()
	@Type(() => Number)
	videoId: number;

	fileId: number;
}
