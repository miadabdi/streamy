import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { randomBytes } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { Response } from 'express';
import { JWT_COOKIE_NAME } from '../common/constants';
import IDrizzleError from '../drizzle/drizzle-error.interface';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { usersTableColumns } from '../drizzle/table-columns';
import { MailService } from '../mail/mail.service';
import { AuthDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private jwtService: JwtService,
		private configService: ConfigService,
		private drizzleService: DrizzleService,
		private mailService: MailService,
	) {}

	hash(input: string, iterations: number = 3) {
		return argon.hash(input, { timeCost: iterations });
	}

	matchHash(hashed: string, input: string) {
		return argon.verify(hashed, input);
	}

	async signUp(authDto: AuthDto) {
		const hash = await this.hash(authDto.password);

		try {
			const {
				password,
				passwordChangedAt,
				passwordResetToken,
				passwordResetExpiresAt,
				...returningKeys
			} = usersTableColumns;
			const user = await this.drizzleService.db
				.insert(schema.users)
				.values({ ...authDto, password: hash })
				.returning(returningKeys)
				.execute();

			return user[0];
		} catch (error: unknown) {
			const { code, constraint } = error as IDrizzleError;
			if (code === '23505' && constraint === 'users_email_unique') {
				// The .code property can be accessed in a type-safe manner
				throw new ConflictException('Email taken, a new user cannot be created with this email');
			}

			if (error instanceof Error) {
				this.logger.error(error.message, error.stack);
			}
			throw new InternalServerErrorException('Something went wrong, try again later');
		}
	}

	async signIn(response: Response, authDto: AuthDto) {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.email, authDto.email),
		});

		if (!user) {
			throw new ForbiddenException('Credentials is incorrect');
		}

		const pwMatch = await this.matchHash(user.password, authDto.password);

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

		// this.mailService.sendHtml(user.email, 'Welcome to B{log', 'Welcome to Blog');
		await this.drizzleService.db
			.update(schema.users)
			.set({ lastLoginAt: new Date() })
			.where(eq(schema.users.email, authDto.email))
			.execute();
	}

	async signToken(userId: number, email: string) {
		const paylaod = {
			sub: userId,
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

	async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
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

	async resetPassword(resetPasswordDto: ResetPasswordDto) {
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
