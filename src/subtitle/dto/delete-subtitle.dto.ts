import { PickType } from '@nestjs/swagger';
import { UpdateSubtitleDto } from './update-subtitle.dto';

export class DeleteSubtitleDto extends PickType(UpdateSubtitleDto, ['id']) {}
