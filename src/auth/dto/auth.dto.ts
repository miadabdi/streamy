import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { CreateChannelDto } from '../../channel/dto';

export class AuthDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsString()
	@IsNotEmpty()
	@Length(8, 32)
	password: string;

	@IsNotEmpty()
	@Type(() => CreateChannelDto)
	channel: CreateChannelDto;
}
