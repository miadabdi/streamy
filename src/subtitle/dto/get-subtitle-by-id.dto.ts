import { PickType } from '@nestjs/swagger';
import { UpdateSubtitleDto } from './update-subtitle.dto';

export class GetSubtitleByIdDto extends PickType(UpdateSubtitleDto, ['id']) {}
