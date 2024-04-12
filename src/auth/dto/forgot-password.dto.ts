import { PickType } from '@nestjs/swagger';
import { SignUpDto } from './sign-up.dto';

export class ForgotPasswordDto extends PickType(SignUpDto, ['email']) {}
