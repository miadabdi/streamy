import { User } from '../drizzle/schema';
import {
	AddVideosDto,
	CreatePlaylistDto,
	DeletePlaylistDto,
	GetPlaylistByIdDto,
	UpdatePlaylistDto,
} from './dto';
import { PlaylistService } from './playlist.service';
export declare class PlaylistController {
	private playlistService;
	constructor(playlistService: PlaylistService);
	createPlaylist(
		createPlaylistDto: CreatePlaylistDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'custom' | 'likes' | 'dislikes' | 'watched';
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		privacy: 'private' | 'public';
	}>;
	addVideos(
		addVideosDto: AddVideosDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	updatePlaylist(
		updatePlaylistDto: UpdatePlaylistDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'custom' | 'likes' | 'dislikes' | 'watched';
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		privacy: 'private' | 'public';
	}>;
	getPlaylistById(
		getPlaylistByIdDto: GetPlaylistByIdDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		channelId: number;
		type: 'custom' | 'likes' | 'dislikes' | 'watched';
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		privacy: 'private' | 'public';
	}>;
	deletePlaylist(
		deletePlaylistDto: DeletePlaylistDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
