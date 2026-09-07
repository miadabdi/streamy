import { IsString, Length, Matches } from 'class-validator';
import { CHANNEL_USERNAME_REGEX } from '../../common/constants';

export class CreateChannelDto {
	@Matches(new RegExp(CHANNEL_USERNAME_REGEX), {
		message: 'Channel username must contain no _ or . at the beginning or end',
	})
	@IsString()
	@Length(8, 128)
	username: string;

	@IsString()
	@Length(3, 50)
	name: string;

	@IsString()
	@Length(8, 1024)
	description: string;
}
