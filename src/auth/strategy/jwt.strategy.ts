import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_COOKIE_NAME, JWT_STRATEGY_NAME } from '../../common/constants';
import { DrizzleService } from '../../drizzle/drizzle.service';
import * as schema from '../../drizzle/schema';
import { User } from '../../drizzle/schema';
import { Payload } from '../interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
	constructor(
		private configService: ConfigService,
		private drizzleService: DrizzleService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.extractJWTFromCookie]),
			secretOrKey: configService.get<string>('JWT_SECRET'),
		});
	}

	/**
	 * fetches user and returns it based on jwt data
	 * @param {Payload} payload
	 * @returns {User}
	 */
	async validate(payload: Payload): Promise<User> {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.id, payload.userId),
		});

		return user;
	}

	/**
	 * returns jwt cookie if exists
	 * @param {Request} req req object of api call
	 * @returns {string | null}
	 */
	private static extractJWTFromCookie(req: Request): string | null {
		if (req.cookies && req.cookies[JWT_COOKIE_NAME] && req.cookies[JWT_COOKIE_NAME].length > 0) {
			return req.cookies[JWT_COOKIE_NAME];
		}

		return null;
	}
}
