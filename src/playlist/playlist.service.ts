import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { Playlist, User } from '../drizzle/schema';
import { playlistsTableColumns } from '../drizzle/table-columns';
import { VideoService } from '../video/video.service';
import { AddVideosDto, CreatePlaylistDto, DeletePlaylistDto, UpdatePlaylistDto } from './dto';

@Injectable()
export class PlaylistService {
	private logger = new Logger(PlaylistService.name);

	constructor(
		private drizzleService: DrizzleService,
		private videoService: VideoService,
		private channelService: ChannelService,
	) {}

	/**
	 * checks if user owns a playlist
	 * @param {number} id id of playlist
	 * @param {User} user
	 * @throws {NotFoundException} playlist with id not found
	 * @throws {ForbiddenException} user does not own the playlist
	 */
	async userOwnsPlaylist(id: number, user: User) {
		const playlist = await this.drizzleService.db.query.playlists.findFirst({
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
	 * @returns {Playlist}
	 */
	async createPlaylist(createPlaylistDto: CreatePlaylistDto, user: User): Promise<Playlist> {
		await this.channelService.userOwnsChannel(createPlaylistDto.channelId, user);

		const { ...returningKeys } = playlistsTableColumns;
		const playlists = await this.drizzleService.db
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
	 * @returns {{ message: string }}
	 */
	async addVideos(addVideosDto: AddVideosDto, user: User): Promise<{ message: string }> {
		await this.userOwnsPlaylist(addVideosDto.playlistId, user);

		for (const videoId of addVideosDto.videoIds) {
			await this.videoService.userOwnsVideo(videoId, user);
		}

		const values = addVideosDto.videoIds.map((videoId) => {
			return {
				videoId,
				playlistId: addVideosDto.playlistId,
			};
		});
		await this.drizzleService.db.insert(schema.playlistsVideos).values(values).execute();

		return {
			message: 'Videos were added to the playlist',
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
