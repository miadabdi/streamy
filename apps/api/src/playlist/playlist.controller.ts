import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ChannelService } from '../channel/channel.service';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { User } from '../drizzle/schema';
import {
	AddVideosDto,
	CreatePlaylistDto,
	DeletePlaylistDto,
	GetPlaylistByIdDto,
	GetPlaylistsOfChannelDto,
	UpdatePlaylistDto,
} from './dto';
import { PlaylistService } from './playlist.service';

@Controller('/playlist')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
	constructor(
		private playlistService: PlaylistService,
		private channelService: ChannelService,
	) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createPlaylist(@Body() createPlaylistDto: CreatePlaylistDto, @GetUser() user: User) {
		return this.playlistService.createPlaylist(createPlaylistDto, user);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('/add-videos')
	addVideos(@Body() addVideosDto: AddVideosDto, @GetUser() user: User) {
		return this.playlistService.addVideos(addVideosDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch()
	updatePlaylist(@Body() updatePlaylistDto: UpdatePlaylistDto, @GetUser() user: User) {
		return this.playlistService.updatePlaylist(updatePlaylistDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-id')
	getPlaylistById(@Query() getPlaylistByIdDto: GetPlaylistByIdDto, @GetUser() user: User) {
		return this.playlistService.getPlaylistById(getPlaylistByIdDto.id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-channel')
	async getPlaylistsOfChannel(
		@Query() getPlaylistsOfChannelDto: GetPlaylistsOfChannelDto,
		@GetUser() user: User,
	) {
		// Own-library route: a channel that doesn't exist and a channel you
		// don't own are the same answer (no existence oracle).
		const channel = await this.channelService.getChannelById(getPlaylistsOfChannelDto.channelId);
		if (!channel || channel.ownerId !== user.id) {
			throw new ForbiddenException(
				`You don't own channel with id ${getPlaylistsOfChannelDto.channelId}`,
			);
		}
		return this.playlistService.getPlaylistsOfChannel(getPlaylistsOfChannelDto.channelId);
	}

	@HttpCode(HttpStatus.OK)
	@Delete()
	deletePlaylist(@Query() deletePlaylistDto: DeletePlaylistDto, @GetUser() user: User) {
		return this.playlistService.deletePlaylist(deletePlaylistDto, user);
	}
}
