import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class GetVideoPresignedPutURLDto {
	@IsInt()
	@Type(() => Number)
	id: number;

	@IsString()
	@IsNotEmpty()
	path: string;
}
