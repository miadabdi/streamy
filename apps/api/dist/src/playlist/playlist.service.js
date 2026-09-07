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
var PlaylistService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.PlaylistService = void 0;
const common_1 = require('@nestjs/common');
const drizzle_orm_1 = require('drizzle-orm');
const channel_service_1 = require('../channel/channel.service');
const decorators_1 = require('../common/decorators');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const dto_1 = require('./dto');
let PlaylistService = (PlaylistService_1 = class PlaylistService {
	constructor(drizzleService, channelService) {
		this.drizzleService = drizzleService;
		this.channelService = channelService;
		this.logger = new common_1.Logger(PlaylistService_1.name);
	}
	async userOwnsPlaylist(id, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const playlist = await manager.query.playlists.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.playlists.id, id),
			with: {
				channel: true,
			},
		});
		if (!playlist) {
			throw new common_1.NotFoundException('Playlist not found');
		}
		if (playlist.channel.ownerId !== user.id) {
			throw new common_1.ForbiddenException("You don't own this playlist");
		}
	}
	async createPlaylist(createPlaylistDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		await this.channelService.userOwnsChannel(createPlaylistDto.channelId, user, tx);
		const { ...returningKeys } = table_columns_1.playlistsTableColumns;
		const playlists = await manager
			.insert(schema.playlists)
			.values({
				...createPlaylistDto,
			})
			.returning(returningKeys)
			.execute();
		return playlists[0];
	}
	async updatePlaylist(updatePlaylistDto, user) {
		await this.userOwnsPlaylist(updatePlaylistDto.id, user);
		const { ...returningKeys } = table_columns_1.playlistsTableColumns;
		const updatedPlaylist = await this.drizzleService.db
			.update(schema.playlists)
			.set({
				...updatePlaylistDto,
			})
			.where((0, drizzle_orm_1.eq)(schema.playlists.id, updatePlaylistDto.id))
			.returning(returningKeys)
			.execute();
		return updatedPlaylist[0];
	}
	async addVideos(addVideosDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		await this.userOwnsPlaylist(addVideosDto.playlistId, user, tx);
		const values = addVideosDto.videoIds.map((videoId) => {
			return {
				videoId,
				playlistId: addVideosDto.playlistId,
			};
		});
		await manager.insert(schema.playlistsVideos).values(values).execute();
		return {
			message: 'Videos were added to the playlist',
		};
	}
	async removeVideos(removeVideosDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		await this.userOwnsPlaylist(removeVideosDto.playlistId, user, tx);
		await Promise.all(
			removeVideosDto.videoIds.map(async (videoId) => {
				await manager
					.delete(schema.playlistsVideos)
					.where(
						(0, drizzle_orm_1.and)(
							(0, drizzle_orm_1.eq)(schema.playlistsVideos.videoId, videoId),
							(0, drizzle_orm_1.eq)(schema.playlistsVideos.playlistId, removeVideosDto.playlistId),
						),
					)
					.execute();
			}),
		);
		return {
			message: 'Videos were removed to the playlist',
		};
	}
	async getPlaylistById(id) {
		return this.drizzleService.db.query.playlists.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.playlists.id, id),
			with: {
				playlistsVideos: {
					with: {
						video: {
							with: {
								thumbnailFile: true,
							},
						},
					},
				},
			},
		});
	}
	async getPlaylistsOfChannel(channelId) {
		return this.drizzleService.db.query.playlists.findMany({
			where: (0, drizzle_orm_1.eq)(schema.playlists.channelId, channelId),
			with: {
				playlistsVideos: {
					with: {
						video: {
							with: {
								thumbnailFile: true,
							},
						},
					},
				},
			},
		});
	}
	async deletePlaylist(deletePlaylistDto, user) {
		await this.userOwnsPlaylist(deletePlaylistDto.id, user);
		await this.drizzleService.db
			.update(schema.playlists)
			.set({ isActive: false, deletedAt: new Date() })
			.where((0, drizzle_orm_1.eq)(schema.playlists.id, deletePlaylistDto.id));
		return {
			message: 'Playlist Deleted Successfully',
		};
	}
});
exports.PlaylistService = PlaylistService;
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeletePlaylistDto, Object]),
		__metadata('design:returntype', Promise),
	],
	PlaylistService.prototype,
	'deletePlaylist',
	null,
);
exports.PlaylistService =
	PlaylistService =
	PlaylistService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__param(
					1,
					(0, common_1.Inject)((0, common_1.forwardRef)(() => channel_service_1.ChannelService)),
				),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					channel_service_1.ChannelService,
				]),
			],
			PlaylistService,
		);
//# sourceMappingURL=playlist.service.js.map
