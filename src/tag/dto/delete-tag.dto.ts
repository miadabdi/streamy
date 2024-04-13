import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class DeleteTagDto {
	@IsInt()
	@Type(() => Number)
	id: number;
}
