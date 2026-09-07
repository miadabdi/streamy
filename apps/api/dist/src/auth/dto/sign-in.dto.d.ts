import { SignUpDto } from './sign-up.dto';
declare const SignInDto_base: import('@nestjs/common').Type<Omit<SignUpDto, 'channel'>>;
export declare class SignInDto extends SignInDto_base {}
export {};
