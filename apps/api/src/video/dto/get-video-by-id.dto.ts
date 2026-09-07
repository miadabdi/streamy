import { PickType } from '@nestjs/swagger';
import { UpdateVideoDto } from './update-video.dto';

export class GetVideoByIdDto extends PickType(UpdateVideoDto, ['id']) {}
