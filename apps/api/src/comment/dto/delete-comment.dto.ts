import { PickType } from '@nestjs/swagger';
import { UpdateCommentDto } from './update-comment.dto';

export class DeleteCommentDto extends PickType(UpdateCommentDto, ['id']) {}
