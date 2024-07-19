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
	AddSubscriptionDto,
	CreateChannelDto,
	DeleteChannelDto,
	GetChannelByIdDto,
	GetChannelByUsernameDto,
	UpdateChannelDto,
} from './dto';
import { DeleteSubscriptionDto } from './dto/delete-subscription.dto';

@Controller('/channel')
@UseGuards(JwtAuthGuard)
export class ChannelController {
	constructor(private channelService: ChannelService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createChannel(@Body() createChannelDto: CreateChannelDto, @GetUser() user: User) {
		return this.channelService.createChannel(createChannelDto, user);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('/add-subscription')
	addSubscription(@Body() addSubscriptionDto: AddSubscriptionDto, @GetUser() user: User) {
		return this.channelService.addSubscription(addSubscriptionDto, user);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('/delete-subscription')
	deleteSubscription(@Body() deleteSubscriptionDto: DeleteSubscriptionDto, @GetUser() user: User) {
		return this.channelService.deleteSubscription(deleteSubscriptionDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch()
	@UseInterceptors(FileInterceptor('avatar'))
	updateChannel(
		@Body() updateChannelDto: UpdateChannelDto,
		@GetUser() user: User,
		@UploadedFile(new SharpPipe({ width: 400, height: 400 })) avatar: Express.Multer.File,
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
