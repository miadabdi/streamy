import { PickType } from '@nestjs/swagger';
import { UpdateChannelDto } from './update-channel.dto';

export class GetChannelByIdDto extends PickType(UpdateChannelDto, ['id']) {}
