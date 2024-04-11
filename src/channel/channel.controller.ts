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
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { SharpPipe } from '../common/pipes/sharp-pipe.pipe';
import { User } from '../drizzle/schema';
import { ChannelService } from './channel.service';
import {
	CreateChannelDto,
	DeleteChannelDto,
	GetChannelByIdDto,
	GetChannelByUsernameDto,
	UpdateChannelDto,
} from './dto';

@Controller('/channel')
@UseGuards(JwtAuthGuard)
export class ChannelController {
	constructor(private channelService: ChannelService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createChannel(@Body() createChannelDto: CreateChannelDto, @GetUser() user: User) {
		return this.channelService.createChannel(createChannelDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch()
	@UseInterceptors(FileInterceptor('avatar'))
	updateChannel(
		@Body() updateChannelDto: UpdateChannelDto,
		@GetUser() user: User,
		@UploadedFile(SharpPipe) avatar: Express.Multer.File,
	) {
		return this.channelService.updateChannel(updateChannelDto, user, avatar);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-id')
	getChannelById(@Query() getChannelByIdDto: GetChannelByIdDto, @GetUser() user: User) {
		return this.channelService.getChannelById(getChannelByIdDto.id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-username')
	getChannelByUsername(
		@Query() getChannelByUsernameDto: GetChannelByUsernameDto,
		@GetUser() user: User,
	) {
		return this.channelService.getChannelByUsername(getChannelByUsernameDto.username);
	}

	@HttpCode(HttpStatus.OK)
	@Delete()
	deleteChannel(@Query() deleteChannelDto: DeleteChannelDto, @GetUser() user: User) {
		return this.channelService.deleteChannel(deleteChannelDto, user);
	}
}
