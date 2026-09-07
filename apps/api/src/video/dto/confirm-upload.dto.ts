import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ConfirmVideoUploadDto {
	@IsInt()
	@Type(() => Number)
	id: number;
}
