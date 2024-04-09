import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
	@IsOptional()
	@IsString()
	@Length(3, 50)
	firstName?: string;

	@IsOptional()
	@IsString()
	@Length(3, 50)
	lastName?: string;
}
