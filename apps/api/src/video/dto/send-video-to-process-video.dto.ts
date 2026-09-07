import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SendVideoToProcessQueueDto {
	@IsInt()
	@Type(() => Number)
	id: number;
}
