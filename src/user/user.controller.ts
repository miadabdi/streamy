import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { User } from '../drizzle/schema';
import { SetCurrentChannelDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';

@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 120, ttl: 60 * 10 } }) // 120 auth requests for 10 minutes
@Controller({ path: 'user', version: '1' })
@UseGuards(JwtAuthGuard)
export class UserController {
	constructor(private readonly userService: UserService) {}

	@HttpCode(HttpStatus.OK)
	@Get('/me')
	getMe(@GetUser() user: User) {
		return this.userService.getMe(user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch('/update-me')
	updateUser(@Body() updateUserDto: UpdateUserDto, @GetUser() user: User) {
		return this.userService.updateUser(updateUserDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch('/set-current-channel')
	async setCurrentChannel(
		@Query() setCurrentChannelDto: SetCurrentChannelDto,
		@GetUser() user: User,
	) {
		return this.userService.setCurrentChannel(setCurrentChannelDto, user);
	}
}
