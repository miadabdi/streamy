import { PickType } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { AuthDto } from './auth.dto';

export class ResetPasswordDto extends PickType(AuthDto, ['email', 'password']) {
	@IsString()
	@Length(64, 64)
	token: string;
}
