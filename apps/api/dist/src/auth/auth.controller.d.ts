import { Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, ResetPasswordDto, SignInDto, SignUpDto } from './dto';
export declare class AuthController {
	private readonly authService;
	constructor(authService: AuthService);
	signUp(signUpDto: SignUpDto): Promise<{
		password: string;
		email: string;
		id: number;
		createdAt: Date;
		updatedAt: Date;
		firstName: string;
		lastName: string;
		isAdmin: boolean;
		isEmailVerified: boolean;
		passwordChangedAt: Date;
		passwordResetToken: string;
		passwordResetExpiresAt: Date;
		lastLoginAt: Date;
		currentChannelId: number;
	}>;
	signIn(response: Response, signInDto: SignInDto): Promise<undefined>;
	forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
		message: string;
	}>;
	resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
		message: string;
	}>;
	signOut(response: Response): Promise<void>;
}
