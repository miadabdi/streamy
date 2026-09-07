import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { User } from '../../drizzle/schema';
import { Payload } from '../interface';
declare const JwtStrategy_base: new (
	...args:
		| [opt: import('passport-jwt').StrategyOptionsWithRequest]
		| [opt: import('passport-jwt').StrategyOptionsWithoutRequest]
) => Strategy & {
	validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
	private configService;
	private drizzleService;
	constructor(configService: ConfigService, drizzleService: DrizzleService);
	validate(payload: Payload): Promise<User>;
	private static extractJWTFromCookie;
}
export {};
