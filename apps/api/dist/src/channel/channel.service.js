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
var __param =
	(this && this.__param) ||
	function (paramIndex, decorator) {
		return function (target, key) {
			decorator(target, key, paramIndex);
		};
	};
var ChannelService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.ChannelService = void 0;
const common_1 = require('@nestjs/common');
const drizzle_orm_1 = require('drizzle-orm');
const decorators_1 = require('../common/decorators');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const file_service_1 = require('../file/file.service');
const playlist_service_1 = require('../playlist/playlist.service');
const dto_1 = require('./dto');
let ChannelService = (ChannelService_1 = class ChannelService {
	constructor(drizzleService, fileService, playlistService) {
		this.drizzleService = drizzleService;
		this.fileService = fileService;
		this.playlistService = playlistService;
		this.logger = new common_1.Logger(ChannelService_1.name);
	}
	async userOwnsChannel(id, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const channel = await manager.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.id, id),
		});
		if (!channel) {
			throw new common_1.NotFoundException(`Channel with id ${id} not found`);
		}
		if (channel.ownerId !== user.id) {
			throw new common_1.ForbiddenException(`You don't own channel with id ${id}`);
		}
	}
	async createChannel(createChannelDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const dupChannel = await manager.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.username, createChannelDto.username),
		});
		if (dupChannel) {
			throw new common_1.ConflictException('Channel with this username already exists');
		}
		const { ...returningKeys } = table_columns_1.channelsTableColumns;
		const channelsRes = await manager
			.insert(schema.channels)
			.values({
				ownerId: user.id,
				...createChannelDto,
			})
			.returning(returningKeys)
			.execute();
		const channel = channelsRes[0];
		await this.playlistService.createPlaylist(
			{
				channelId: channel.id,
				name: 'Liked Videos',
				description: 'Liked Videos',
				privacy: schema.PlaylistPrivacyEnum.private,
				type: 'likes',
			},
			user,
			tx,
		);
		await this.playlistService.createPlaylist(
			{
				channelId: channel.id,
				name: 'Disliked Videos',
				description: 'Disliked Videos',
				privacy: schema.PlaylistPrivacyEnum.private,
				type: 'dislikes',
			},
			user,
			tx,
		);
		await this.playlistService.createPlaylist(
			{
				channelId: channel.id,
				name: 'Watched Videos',
				description: 'Watched Videos',
				privacy: schema.PlaylistPrivacyEnum.private,
				type: 'watched',
			},
			user,
			tx,
		);
		return channel;
	}
	async updateChannel(updateChannelDto, user, avatar) {
		await this.userOwnsChannel(updateChannelDto.id, user);
		if (updateChannelDto.username) {
			const dupChannel = await this.drizzleService.db.query.channels.findFirst({
				where: (0, drizzle_orm_1.and)(
					(0, drizzle_orm_1.eq)(schema.channels.username, updateChannelDto.username),
					(0, drizzle_orm_1.not)((0, drizzle_orm_1.eq)(schema.channels.id, updateChannelDto.id)),
				),
			});
			if (dupChannel) {
				throw new common_1.ConflictException('Channel with this username already exists');
			}
		}
		if (avatar) {
			const file = await this.fileService.uploadAndCreateFileRecord(
				avatar,
				'',
				'channelavatars',
				user,
			);
			updateChannelDto.avatarFileId = file.id;
		}
		const { ...returningKeys } = table_columns_1.channelsTableColumns;
		const updatedChannel = await this.drizzleService.db
			.update(schema.channels)
			.set({
				...updateChannelDto,
			})
			.where((0, drizzle_orm_1.eq)(schema.channels.id, updateChannelDto.id))
			.returning(returningKeys)
			.execute();
		return updatedChannel[0];
	}
	async deleteSubscription(deleteSubscriptionDto, user) {
		await this.userOwnsChannel(deleteSubscriptionDto.followerId, user);
		const followee = await this.drizzleService.db.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.id, deleteSubscriptionDto.followeeId),
		});
		if (!followee) {
			throw new common_1.NotFoundException(
				`Followee channel with id ${deleteSubscriptionDto.followeeId} not found`,
			);
		}
		await this.drizzleService.db
			.delete(schema.subscriptions)
			.where(
				(0, drizzle_orm_1.and)(
					(0, drizzle_orm_1.eq)(schema.subscriptions.followeeId, deleteSubscriptionDto.followeeId),
					(0, drizzle_orm_1.eq)(schema.subscriptions.followerId, deleteSubscriptionDto.followerId),
				),
			)
			.execute();
		await this.drizzleService.db
			.update(schema.channels)
			.set({
				numberOfSubscribers: (0, drizzle_orm_1.sql)`${schema.channels.numberOfSubscribers} - 1`,
			})
			.where((0, drizzle_orm_1.eq)(schema.channels.id, deleteSubscriptionDto.followeeId));
		return {
			message: 'Subscription deleted successfully',
		};
	}
	async addSubscription(addSubscriptionDto, user) {
		await this.userOwnsChannel(addSubscriptionDto.followerId, user);
		const followee = await this.drizzleService.db.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.id, addSubscriptionDto.followeeId),
		});
		if (!followee) {
			throw new common_1.NotFoundException(
				`Followee channel with id ${addSubscriptionDto.followeeId} not found`,
			);
		}
		await this.drizzleService.db
			.insert(schema.subscriptions)
			.values(addSubscriptionDto)
			.onConflictDoNothing()
			.execute();
		await this.drizzleService.db
			.update(schema.channels)
			.set({
				numberOfSubscribers: (0, drizzle_orm_1.sql)`${schema.channels.numberOfSubscribers} + 1`,
			})
			.where((0, drizzle_orm_1.eq)(schema.channels.id, addSubscriptionDto.followeeId));
		return {
			message: 'Subscription added successfully',
		};
	}
	async getChannelByUsername(username) {
		return this.drizzleService.db.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.username, username),
			with: {
				avatar: true,
				subscriptions: {
					with: {
						followee: {
							with: {
								avatar: true,
							},
						},
					},
				},
				playlists: {
					with: {
						playlistsVideos: {
							with: {
								video: true,
							},
						},
					},
				},
			},
		});
	}
	async getChannelById(id) {
		return this.drizzleService.db.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.id, id),
			with: {
				subscriptions: {
					with: {
						followee: {
							with: {
								avatar: true,
							},
						},
					},
				},
				avatar: true,
				playlists: {
					with: {
						playlistsVideos: {
							with: {
								video: true,
							},
						},
					},
				},
			},
		});
	}
	async deleteChannel(deleteChannelDto, user) {
		await this.userOwnsChannel(deleteChannelDto.id, user);
		await this.drizzleService.db
			.update(schema.channels)
			.set({ isActive: false, deletedAt: new Date() })
			.where((0, drizzle_orm_1.eq)(schema.channels.id, deleteChannelDto.id));
		return {
			message: 'Channel Deleted Successfully',
		};
	}
});
exports.ChannelService = ChannelService;
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteChannelDto, Object]),
		__metadata('design:returntype', Promise),
	],
	ChannelService.prototype,
	'deleteChannel',
	null,
);
exports.ChannelService =
	ChannelService =
	ChannelService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__param(
					2,
					(0, common_1.Inject)((0, common_1.forwardRef)(() => playlist_service_1.PlaylistService)),
				),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					file_service_1.FileService,
					playlist_service_1.PlaylistService,
				]),
			],
			ChannelService,
		);
//# sourceMappingURL=channel.service.js.map
