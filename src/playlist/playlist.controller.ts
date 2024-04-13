import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { User } from '../drizzle/schema';
import { CreatePlaylistDto, DeletePlaylistDto, GetPlaylistByIdDto, UpdatePlaylistDto } from './dto';
import { AddVideosDto } from './dto/add-videos.dto';
import { PlaylistService } from './playlist.service';

@Controller('/playlist')
@UseGuards(JwtAuthGuard)
export class PlaylistController {
	constructor(private playlistService: PlaylistService) {}

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
	@Delete()
	deletePlaylist(@Query() deletePlaylistDto: DeletePlaylistDto, @GetUser() user: User) {
		return this.playlistService.deletePlaylist(deletePlaylistDto, user);
	}
}
