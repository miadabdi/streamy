import { PickType } from '@nestjs/swagger';
import { UpdateVideoDto } from './update-video.dto';

export class DeleteVideoDto extends PickType(UpdateVideoDto, ['id']) {}
