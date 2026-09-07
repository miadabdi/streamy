import { IsEmail } from 'class-validator';

export class PromoteUserDto {
	@IsEmail()
	email: string;
}
