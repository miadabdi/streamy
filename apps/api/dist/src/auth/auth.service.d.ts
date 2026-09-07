import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { User } from '../drizzle/schema';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { ForgotPasswordDto, ResetPasswordDto, SignInDto, SignUpDto } from './dto';
export declare class AuthService {
	private jwtService;
	private configService;
	private drizzleService;
	private mailService;
	private channelService;
	private userService;
	private readonly logger;
	constructor(
		jwtService: JwtService,
		configService: ConfigService,
		drizzleService: DrizzleService,
		mailService: MailService,
		channelService: ChannelService,
		userService: UserService,
	);
	hash(input: string, iterations?: number): Promise<string>;
	matchHash(hashed: string, input: string): Promise<boolean>;
	signUp(signUpDto: SignUpDto): Promise<User>;
	signIn(response: Response, signInDto: SignInDto): Promise<undefined>;
	signToken(userId: number, email: string): Promise<string>;
	forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
		message: string;
	}>;
	resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
		message: string;
	}>;
}
