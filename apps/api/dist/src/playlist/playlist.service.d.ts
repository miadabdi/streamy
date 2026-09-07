import { ChannelService } from '../channel/channel.service';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import { Playlist, User } from '../drizzle/schema';
import { AddVideosDto, CreatePlaylistDto, DeletePlaylistDto, UpdatePlaylistDto } from './dto';
export declare class PlaylistService {
	private drizzleService;
	private channelService;
	private logger;
	constructor(drizzleService: DrizzleService, channelService: ChannelService);
	userOwnsPlaylist(id: number, user: User, tx?: TransactionType): Promise<void>;
	createPlaylist(
		createPlaylistDto: CreatePlaylistDto,
		user: User,
		tx?: TransactionType,
	): Promise<Playlist>;
	updatePlaylist(updatePlaylistDto: UpdatePlaylistDto, user: User): Promise<Playlist>;
	addVideos(
		addVideosDto: AddVideosDto,
		user: User,
		tx?: TransactionType,
	): Promise<{
		message: string;
	}>;
	removeVideos(
		removeVideosDto: AddVideosDto,
		user: User,
		tx?: TransactionType,
	): Promise<{
		message: string;
	}>;
	getPlaylistById(id: number): Promise<Playlist>;
	getPlaylistsOfChannel(channelId: number): Promise<Playlist[]>;
	deletePlaylist(
		deletePlaylistDto: DeletePlaylistDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
