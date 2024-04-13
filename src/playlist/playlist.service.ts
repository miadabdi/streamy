import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { GetUser } from '../common/decorators';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { playlistTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { CreatePlaylistDto, DeletePlaylistDto, UpdatePlaylistDto } from './dto';

@Injectable()
export class PlaylistService {
	private logger = new Logger(PlaylistService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
	) {}

	async userOwnsChannel(id: number, user: User) {
		const channel = await this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, id),
		});

		if (!channel) {
			throw new NotFoundException('Channel not found');
		}

		if (channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this channel");
		}
	}

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
		await this.userOwnsChannel(createPlaylistDto.channelId, user);

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
