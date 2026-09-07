import { PickType } from '@nestjs/swagger';
import { UpdatePlaylistDto } from './update-playlist.dto';

export class DeletePlaylistDto extends PickType(UpdatePlaylistDto, ['id']) {}
