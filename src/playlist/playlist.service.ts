import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { playlistTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { VideoService } from '../video/video.service';
import { AddVideosDto, CreatePlaylistDto, DeletePlaylistDto, UpdatePlaylistDto } from './dto';

@Injectable()
export class PlaylistService {
	private logger = new Logger(PlaylistService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
		private videoService: VideoService,
		private channelService: ChannelService,
	) {}

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

	async createPlaylist(createPlaylistDto: CreatePlaylistDto, user: User) {
		await this.channelService.userOwnsChannel(createPlaylistDto.channelId, user);

		const { ...returningKeys } = playlistTableColumns;
		const playlists = await this.drizzleService.db
			.insert(schema.playlists)
			.values({
				...createPlaylistDto,
			})
			.returning(returningKeys)
			.execute();

		return playlists[0];
	}

	async updatePlaylist(updatePlaylistDto: UpdatePlaylistDto, user: User) {
		await this.userOwnsPlaylist(updatePlaylistDto.id, user);

		const { ...returningKeys } = playlistTableColumns;
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

	async addVideos(addVideosDto: AddVideosDto, user: User) {
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

	async getPlaylistById(id: number) {
		return this.drizzleService.db.query.playlists.findFirst({
			where: eq(schema.playlists.id, id),
		});
	}

	async deletePlaylist(deletePlaylistDto: DeletePlaylistDto, @GetUser() user: User) {
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
