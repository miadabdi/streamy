import { SignUpDto } from './sign-up.dto';
declare const ResetPasswordDto_base: import('@nestjs/common').Type<
	Pick<SignUpDto, 'password' | 'email'>
>;
export declare class ResetPasswordDto extends ResetPasswordDto_base {
	token: string;
}
export {};
