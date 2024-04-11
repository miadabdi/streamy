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
	updateChannel(@Body() updateChannelDto: UpdateChannelDto, @GetUser() user: User) {
		return this.channelService.updateChannel(updateChannelDto, user);
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
