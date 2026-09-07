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
var AuthService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.AuthService = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const jwt_1 = require('@nestjs/jwt');
const argon = __importStar(require('argon2'));
const crypto_1 = require('crypto');
const drizzle_orm_1 = require('drizzle-orm');
const channel_service_1 = require('../channel/channel.service');
const constants_1 = require('../common/constants');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const mail_service_1 = require('../mail/mail.service');
const user_service_1 = require('../user/user.service');
let AuthService = (AuthService_1 = class AuthService {
	constructor(jwtService, configService, drizzleService, mailService, channelService, userService) {
		this.jwtService = jwtService;
		this.configService = configService;
		this.drizzleService = drizzleService;
		this.mailService = mailService;
		this.channelService = channelService;
		this.userService = userService;
		this.logger = new common_1.Logger(AuthService_1.name);
	}
	hash(input, iterations = 3) {
		return argon.hash(input, { timeCost: iterations });
	}
	matchHash(hashed, input) {
		return argon.verify(hashed, input);
	}
	async signUp(signUpDto) {
		const uniqueUser = await this.drizzleService.db.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.email, signUpDto.email),
		});
		if (uniqueUser) {
			throw new common_1.ConflictException(
				'Email taken, a new user cannot be created with this email',
			);
		}
		try {
			const {
				password,
				passwordChangedAt,
				passwordResetToken,
				passwordResetExpiresAt,
				...returningKeys
			} = table_columns_1.usersTableColumns;
			let user;
			const hash = await this.hash(signUpDto.password);
			await this.drizzleService.db.transaction(async (tx) => {
				const users = await tx
					.insert(schema.users)
					.values({ ...signUpDto, password: hash })
					.returning(returningKeys)
					.execute();
				user = users[0];
				const channel = await this.channelService.createChannel(signUpDto.channel, user, tx);
				await this.userService.setCurrentChannel({ currentChannelId: channel.id }, user, tx);
				user = await this.userService.getMe(user, tx);
			});
			return user;
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}
	async signIn(response, signInDto) {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.email, signInDto.email),
		});
		if (!user) {
			throw new common_1.ForbiddenException('Credentials is incorrect');
		}
		const pwMatch = await this.matchHash(user.password, signInDto.password);
		if (!pwMatch) {
			throw new common_1.ForbiddenException('Credentials is incorrect');
		}
		delete user.password;
		const jwtCookie = await this.signToken(user.id, user.email);
		const cookieExpiresIn = this.configService.get('COOKIE_EXPIRES_IN');
		response.cookie(constants_1.JWT_COOKIE_NAME, jwtCookie, {
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
			.where((0, drizzle_orm_1.eq)(schema.users.email, signInDto.email))
			.execute();
	}
	async signToken(userId, email) {
		const paylaod = {
			userId,
			email,
		};
		const secret = this.configService.get('JWT_SECRET');
		const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN');
		const token = await this.jwtService.signAsync(paylaod, {
			expiresIn: `${jwtExpiresIn}d`,
			secret,
		});
		return token;
	}
	async forgotPassword(forgotPasswordDto) {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.email, forgotPasswordDto.email),
		});
		if (!user) {
			throw new common_1.NotFoundException('User not found');
		}
		const token = (0, crypto_1.randomBytes)(32).toString('hex');
		const hashedToken = await this.hash(token);
		await this.drizzleService.db
			.update(schema.users)
			.set({
				passwordResetToken: hashedToken,
				passwordResetExpiresAt: (0, drizzle_orm_1.sql)`CURRENT_TIMESTAMP + INTERVAL '1 DAY'`,
			})
			.where((0, drizzle_orm_1.eq)(schema.users.email, user.email));
		this.mailService.sendForgotPassword(user.email, token);
		return {
			message: 'Reset Email Sent',
		};
	}
	async resetPassword(resetPasswordDto) {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.email, resetPasswordDto.email),
		});
		if (!user || !user.passwordResetToken) {
			throw new common_1.BadRequestException('No Reset password Set for this account');
		}
		const pwMatch = await this.matchHash(user.passwordResetToken, resetPasswordDto.token);
		if (!pwMatch) {
			throw new common_1.ForbiddenException('Token is incorrect');
		}
		if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
			throw new common_1.ForbiddenException('Reset token expired');
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
			.where((0, drizzle_orm_1.eq)(schema.users.email, user.email));
		this.mailService.sendPasswordChanged(user.email, user.email);
		return {
			message: 'Password Changed Successfully',
		};
	}
});
exports.AuthService = AuthService;
exports.AuthService =
	AuthService =
	AuthService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					jwt_1.JwtService,
					config_1.ConfigService,
					drizzle_service_1.DrizzleService,
					mail_service_1.MailService,
					channel_service_1.ChannelService,
					user_service_1.UserService,
				]),
			],
			AuthService,
		);
//# sourceMappingURL=auth.service.js.map
