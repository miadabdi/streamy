import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class AuthDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@Length(8, 32)
	password: string;
}
