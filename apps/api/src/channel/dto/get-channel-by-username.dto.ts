import { PickType } from '@nestjs/swagger';
import { CreateChannelDto } from './create-channel.dto';

export class GetChannelByUsernameDto extends PickType(CreateChannelDto, ['username']) {}
