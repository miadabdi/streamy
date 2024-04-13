import { IsString, Length } from 'class-validator';

export class CreateTagDto {
	@IsString()
	@Length(3, 256)
	title: string;
}
