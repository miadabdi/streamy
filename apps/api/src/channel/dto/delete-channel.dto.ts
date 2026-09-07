import { PickType } from '@nestjs/swagger';
import { UpdateChannelDto } from './update-channel.dto';

export class DeleteChannelDto extends PickType(UpdateChannelDto, ['id']) {}
