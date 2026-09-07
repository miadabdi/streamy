'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __decorate =
	(this && this.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
			r = Reflect.decorate(decorators, target, key, desc);
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return (c > 3 && r && Object.defineProperty(target, key, r), r);
	};
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
var JwtStrategy_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.JwtStrategy = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const passport_1 = require('@nestjs/passport');
const drizzle_orm_1 = require('drizzle-orm');
const passport_jwt_1 = require('passport-jwt');
const constants_1 = require('../../common/constants');
const drizzle_service_1 = require('../../drizzle/drizzle.service');
const schema = __importStar(require('../../drizzle/schema'));
let JwtStrategy = (JwtStrategy_1 = class JwtStrategy extends (
	(0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, constants_1.JWT_STRATEGY_NAME)
) {
	constructor(configService, drizzleService) {
		super({
			jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
				JwtStrategy_1.extractJWTFromCookie,
			]),
			secretOrKey: configService.get('JWT_SECRET'),
		});
		this.configService = configService;
		this.drizzleService = drizzleService;
	}
	async validate(payload) {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.id, payload.userId),
		});
		if (!user) {
			throw new common_1.UnauthorizedException();
		}
		if (
			user.passwordChangedAt &&
			payload.iat &&
			payload.iat * 1000 < user.passwordChangedAt.getTime()
		) {
			throw new common_1.UnauthorizedException('Session expired, sign in again');
		}
		const { password, passwordResetToken, ...safeUser } = user;
		return safeUser;
	}
	static extractJWTFromCookie(req) {
		if (
			req.cookies &&
			req.cookies[constants_1.JWT_COOKIE_NAME] &&
			req.cookies[constants_1.JWT_COOKIE_NAME].length > 0
		) {
			return req.cookies[constants_1.JWT_COOKIE_NAME];
		}
		return null;
	}
});
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy =
	JwtStrategy =
	JwtStrategy_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [config_1.ConfigService, drizzle_service_1.DrizzleService]),
			],
			JwtStrategy,
		);
//# sourceMappingURL=jwt.strategy.js.map
