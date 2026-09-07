import { PickType } from '@nestjs/swagger';
import { UpdateCommentDto } from './update-comment.dto';

export class GetCommentByIdDto extends PickType(UpdateCommentDto, ['id']) {}
