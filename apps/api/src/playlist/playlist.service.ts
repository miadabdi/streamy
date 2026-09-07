import {
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
import { GetUser } from '../common/decorators';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { Playlist, User } from '../drizzle/schema';
import { playlistsTableColumns } from '../drizzle/table-columns';
import { AddVideosDto, CreatePlaylistDto, DeletePlaylistDto, UpdatePlaylistDto } from './dto';

@Injectable()
export class PlaylistService {
	private logger = new Logger(PlaylistService.name);

	constructor(
		private drizzleService: DrizzleService,
		@Inject(forwardRef(() => ChannelService))
		private channelService: ChannelService,
	) {}

	/**
	 * checks if user owns a playlist
	 * @param {number} id id of playlist
	 * @param {User} user
	 * @param {TransactionType} tx[]
	 * @throws {NotFoundException} playlist with id not found
	 * @throws {ForbiddenException} user does not own the playlist
	 */
	async userOwnsPlaylist(id: number, user: User, tx?: TransactionType) {
		const manager = tx ? tx : this.drizzleService.db;

		const playlist = await manager.query.playlists.findFirst({
			where: eq(schema.playlists.id, id),
			with: {
				channel: true,
			},
		});

		if (!playlist) {
			throw new NotFoundException('Playlist not found');
		}

		if (playlist.channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this playlist");
		}
	}

	/**
	 * creates a playlist
	 * @param {CreatePlaylistDto} createPlaylistDto
	 * @param {User} user
	 * @param {TransactionType} tx[]
	 * @returns {Playlist}
	 */
	async createPlaylist(
		createPlaylistDto: CreatePlaylistDto,
		user: User,
		tx?: TransactionType,
	): Promise<Playlist> {
		const manager = tx ? tx : this.drizzleService.db;

		await this.channelService.userOwnsChannel(createPlaylistDto.channelId, user, tx);

		const { ...returningKeys } = playlistsTableColumns;
		const playlists = await manager
			.insert(schema.playlists)
			.values({
				...createPlaylistDto,
			})
			.returning(returningKeys)
			.execute();

		return playlists[0];
	}

	/**
	 * updates a playlist
	 * @param {UpdatePlaylistDto} updatePlaylistDto
	 * @param {User} user
	 * @returns {Playlist}
	 */
	async updatePlaylist(updatePlaylistDto: UpdatePlaylistDto, user: User): Promise<Playlist> {
		await this.userOwnsPlaylist(updatePlaylistDto.id, user);

		const { ...returningKeys } = playlistsTableColumns;
		const updatedPlaylist = await this.drizzleService.db
			.update(schema.playlists)
			.set({
				...updatePlaylistDto,
			})
			.where(eq(schema.playlists.id, updatePlaylistDto.id))
			.returning(returningKeys)
			.execute();

		return updatedPlaylist[0];
	}

	/**
	 * adds a video to playlist
	 * @param {AddVideosDto} addVideosDto
	 * @param {User} user
	 * @param {TransactionType} tx[]
	 * @returns {{ message: string }}
	 */
	async addVideos(
		addVideosDto: AddVideosDto,
		user: User,
		tx?: TransactionType,
	): Promise<{ message: string }> {
		const manager = tx ? tx : this.drizzleService.db;

		await this.userOwnsPlaylist(addVideosDto.playlistId, user, tx);

		// for (const videoId of addVideosDto.videoIds) {
		// 	await this.videoService.userOwnsVideo(videoId, user);
		// }

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

	/**
	 * removes a video from playlist
	 * @param {AddVideosDto} removeVideosDto
	 * @param {User} user
	 * @param {TransactionType} tx[]
	 * @returns {{ message: string }}
	 */
	async removeVideos(
		removeVideosDto: AddVideosDto,
		user: User,
		tx?: TransactionType,
	): Promise<{ message: string }> {
		const manager = tx ? tx : this.drizzleService.db;

		await this.userOwnsPlaylist(removeVideosDto.playlistId, user, tx);

		await Promise.all(
			removeVideosDto.videoIds.map(async (videoId) => {
				await manager
					.delete(schema.playlistsVideos)
					.where(
						and(
							eq(schema.playlistsVideos.videoId, videoId),
							eq(schema.playlistsVideos.playlistId, removeVideosDto.playlistId),
						),
					)
					.execute();
			}),
		);

		return {
			message: 'Videos were removed to the playlist',
		};
	}

	/**
	 * finds and returns a playlist with id of input id
	 * @param {number} id
	 * @returns {Playlist}
	 */
	async getPlaylistById(id: number): Promise<Playlist> {
		return this.drizzleService.db.query.playlists.findFirst({
			where: eq(schema.playlists.id, id),
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

	/**
	 * finds and returns a playlist with channelId of input channelId
	 * @param {number} channelId
	 * @returns {Playlist}
	 */
	async getPlaylistsOfChannel(channelId: number): Promise<Playlist[]> {
		return this.drizzleService.db.query.playlists.findMany({
			where: eq(schema.playlists.channelId, channelId),
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

	/**
	 * deletes a playlist
	 * @param {DeletePlaylistDto} deletePlaylistDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async deletePlaylist(
		deletePlaylistDto: DeletePlaylistDto,
		@GetUser() user: User,
	): Promise<{ message: string }> {
		await this.userOwnsPlaylist(deletePlaylistDto.id, user);

		await this.drizzleService.db
			.update(schema.playlists)
			.set({ isActive: false, deletedAt: new Date() })
			.where(eq(schema.playlists.id, deletePlaylistDto.id));

		return {
			message: 'Playlist Deleted Successfully',
		};
	}
}
