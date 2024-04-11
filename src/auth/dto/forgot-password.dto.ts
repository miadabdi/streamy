import { PickType } from '@nestjs/swagger';
import { AuthDto } from './auth.dto';

export class ForgotPasswordDto extends PickType(AuthDto, ['email']) {}
