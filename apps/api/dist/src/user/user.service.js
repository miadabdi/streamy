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
var UserService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.UserService = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const drizzle_orm_1 = require('drizzle-orm');
const channel_service_1 = require('../channel/channel.service');
const map_cols_to_returning_keys_1 = require('../common/helpers/map-cols-to-returning-keys');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
let UserService = (UserService_1 = class UserService {
	constructor(drizzleService, channelService, configService) {
		this.drizzleService = drizzleService;
		this.channelService = channelService;
		this.configService = configService;
		this.logger = new common_1.Logger(UserService_1.name);
	}
	async onModuleInit() {
		const emails = (this.configService.get('ADMIN_EMAILS') ?? '')
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean);
		if (emails.length === 0) return;
		const promoted = await this.drizzleService.db
			.update(schema.users)
			.set({ isAdmin: true })
			.where((0, drizzle_orm_1.inArray)(schema.users.email, emails))
			.returning({ email: schema.users.email })
			.execute();
		this.logger.log(`ADMIN_EMAILS: ${promoted.length} of ${emails.length} account(s) are admins`);
	}
	async promoteUser(email) {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.email, email.toLowerCase()),
		});
		if (!user) {
			throw new common_1.NotFoundException(`User with email ${email} not found`);
		}
		await this.drizzleService.db
			.update(schema.users)
			.set({ isAdmin: true })
			.where((0, drizzle_orm_1.eq)(schema.users.id, user.id))
			.execute();
		return { message: 'User promoted to admin successfully' };
	}
	async getMe(user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const { passwordChangedAt, passwordResetToken, passwordResetExpiresAt, password, ...userKeys } =
			table_columns_1.usersTableColumns;
		const returningKeys = (0, map_cols_to_returning_keys_1.mapColsToReturningKeys)(userKeys);
		const userRecord = await manager.query.users.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.users.id, user.id),
			with: {
				channels: true,
			},
			columns: returningKeys,
		});
		return userRecord;
	}
	async updateUser(updateUserDto, user) {
		const {
			password,
			passwordChangedAt,
			passwordResetToken,
			passwordResetExpiresAt,
			...returningKeys
		} = table_columns_1.usersTableColumns;
		const updateResults = await this.drizzleService.db
			.update(schema.users)
			.set(updateUserDto)
			.where((0, drizzle_orm_1.eq)(schema.users.id, user.id))
			.returning({ ...returningKeys })
			.execute();
		const updatedUser = updateResults[0];
		return updatedUser;
	}
	async setCurrentChannel(setCurrentChannelDto, user, tx) {
		const {
			password,
			passwordChangedAt,
			passwordResetToken,
			passwordResetExpiresAt,
			...returningKeys
		} = table_columns_1.usersTableColumns;
		const manager = tx ? tx : this.drizzleService.db;
		await this.channelService.userOwnsChannel(setCurrentChannelDto.currentChannelId, user, tx);
		const updateResults = await manager
			.update(schema.users)
			.set({ currentChannelId: setCurrentChannelDto.currentChannelId })
			.where((0, drizzle_orm_1.eq)(schema.users.id, user.id))
			.returning(returningKeys)
			.execute();
		const updatedUser = updateResults[0];
		return updatedUser;
	}
});
exports.UserService = UserService;
exports.UserService =
	UserService =
	UserService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					channel_service_1.ChannelService,
					config_1.ConfigService,
				]),
			],
			UserService,
		);
//# sourceMappingURL=user.service.js.map
