import { OmitType } from '@nestjs/swagger';
import { SignUpDto } from './sign-up.dto';

export class SignInDto extends OmitType(SignUpDto, ['channel']) {}
