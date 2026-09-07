import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetTagByIdDto {
	@IsInt()
	@Type(() => Number)
	id: number;
}
