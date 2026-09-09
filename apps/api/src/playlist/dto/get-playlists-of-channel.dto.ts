import { PickType } from '@nestjs/swagger';
import { CreatePlaylistDto } from './create-playlist.dto';

export class GetPlaylistsOfChannelDto extends PickType(CreatePlaylistDto, ['channelId']) {}
