import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { Response } from 'express';
import { ChannelService } from '../channel/channel.service';
import { JWT_COOKIE_NAME } from '../common/constants';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { usersTableColumns } from '../drizzle/table-columns';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { ForgotPasswordDto, ResetPasswordDto, SignInDto, SignUpDto } from './dto';
import { Payload } from './interface';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private drizzleService: DrizzleService,
		private mailService: MailService,
		private channelService: ChannelService,
		private userService: UserService,
	) {}

	/**
	 * this method hashes the input
	 * @param {string} input the string to hash
	 * @param {number} [iterations=3] number of iteration, higher more secure more cpu intensive
	 * @returns {string}
	 */
	hash(input: string, iterations: number = 3): Promise<string> {
		return argon.hash(input, { timeCost: iterations });
	}

	/**
	 * this method verifies if input matches hashed string
	 * @param {string} hashed hashed string
	 * @param {string} input input string to be verified
	 * @returns {boolean}
	 */
	matchHash(hashed: string, input: string): Promise<boolean> {
		return argon.verify(hashed, input);
	}

	/**
	 * creates a user and a channel associated with that user
	 * @param {SignUpDto} signUpDto
	 * @returns {User}
	 */
	async signUp(signUpDto: SignUpDto): Promise<User> {
		const uniqueUser = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.email, signUpDto.email),
		});
		if (uniqueUser) {
			throw new ConflictException('Email taken, a new user cannot be created with this email');
		}

		try {
			const {
				password,
				passwordChangedAt,
				passwordResetToken,
				passwordResetExpiresAt,
				...returningKeys
			} = usersTableColumns;

			let user: User;

			const hash = await this.hash(signUpDto.password);

			await this.drizzleService.db.transaction(async (tx) => {
				const users = await tx
					.insert(schema.users)
					.values({ ...signUpDto, password: hash })
					.returning(returningKeys)
					.execute();

				user = users[0] as User;

				const channel = await this.channelService.createChannel(signUpDto.channel, user, tx);
				await this.userService.setCurrentChannel({ currentChannelId: channel.id }, user, tx);

				user = await this.userService.getMe(user, tx);
			});

			return user;
		} catch (error: unknown) {
			this.logger.error(error);
			throw error;
		}
	}

	/**
	 * validates cridentials then sends back a jwt in cookies
	 * @param {Response} response response object of current api call
	 * @param {SignInDto} signInDto
	 * @returns {undefined}
	 */
	async signIn(response: Response, signInDto: SignInDto): Promise<undefined> {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.email, signInDto.email),
		});

		if (!user) {
			throw new ForbiddenException('Credentials is incorrect');
		}

		const pwMatch = await this.matchHash(user.password, signInDto.password);

		if (!pwMatch) {
			throw new ForbiddenException('Credentials is incorrect');
		}

		delete user.password;

		const jwtCookie = await this.signToken(user.id, user.email);
		const cookieExpiresIn = this.configService.get<number>('COOKIE_EXPIRES_IN');

		response.cookie(JWT_COOKIE_NAME, jwtCookie, {
			expires: new Date(new Date().getTime() + cookieExpiresIn * 1000 * 60 * 60 * 24),
			sameSite: 'strict',
			httpOnly: true,
		});

		await this.mailService.sendEmailRMQMsg({
			to: user.email,
			subject: 'New Sign in',
			html: '<h1>New Sign in</h1>',
		});

		await this.drizzleService.db
			.update(schema.users)
			.set({ lastLoginAt: new Date() })
			.where(eq(schema.users.email, signInDto.email))
			.execute();
	}

	/**
	 * signs and returns a jwt token
	 * @param {number} userId userId will be saved in jwt
	 * @param {email} email email will be saved in jwt
	 * @returns {string}
	 */
	async signToken(userId: number, email: string): Promise<string> {
		const paylaod: Payload = {
			userId,
			email,
		};

		const secret = this.configService.get<string>('JWT_SECRET');
		const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN');

		const token = await this.jwtService.signAsync(paylaod, {
			expiresIn: `${jwtExpiresIn}d`,
			secret,
		});

		return token;
	}

	/**
	 * creates forgotPassword token and sends to user's email
	 * @param {ForgotPasswordDto} forgotPasswordDto
	 * @returns {{ message: string }}
	 */
	async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.email, forgotPasswordDto.email),
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		const token = randomBytes(32).toString('hex');
		const hashedToken = await this.hash(token);

		await this.drizzleService.db
			.update(schema.users)
			.set({
				passwordResetToken: hashedToken,
				passwordResetExpiresAt: sql`CURRENT_TIMESTAMP + INTERVAL '1 DAY'`,
			})
			.where(eq(schema.users.email, user.email));

		this.mailService.sendForgotPassword(user.email, token);

		return {
			message: 'Reset Email Sent',
		};
	}

	/**
	 * checks resetToken and if valid, password will be changed
	 * @param {ResetPasswordDto} resetPasswordDto
	 * @returns {{ message: string }}
	 */
	async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.email, resetPasswordDto.email),
		});

		if (!user || !user.passwordResetToken) {
			throw new BadRequestException('No Reset password Set for this account');
		}

		const pwMatch = await this.matchHash(user.passwordResetToken, resetPasswordDto.token);

		if (!pwMatch) {
			throw new ForbiddenException('Token is incorrect');
		}

		const hash = await this.hash(resetPasswordDto.password);

		await this.drizzleService.db
			.update(schema.users)
			.set({
				password: hash,
				passwordChangedAt: new Date(),
				passwordResetExpiresAt: null,
				passwordResetToken: null,
			})
			.where(eq(schema.users.email, user.email));

		this.mailService.sendPasswordChanged(user.email, user.email);

		return {
			message: 'Password Changed Successfully',
		};
	}
}
