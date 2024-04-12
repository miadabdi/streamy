import { PickType } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { SignUpDto } from './sign-up.dto';

export class ResetPasswordDto extends PickType(SignUpDto, ['email', 'password']) {
	@IsString()
	@Length(64, 64)
	token: string;
}
