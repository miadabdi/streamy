import { PickType } from '@nestjs/swagger';
import { UpdatePlaylistDto } from './update-playlist.dto';

export class GetPlaylistByIdDto extends PickType(UpdatePlaylistDto, ['id']) {}
