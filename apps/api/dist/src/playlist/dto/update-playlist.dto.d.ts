import { CreatePlaylistDto } from './create-playlist.dto';
declare const UpdatePlaylistDto_base: import('@nestjs/common').Type<
	Omit<Partial<CreatePlaylistDto>, 'channelId'>
>;
export declare class UpdatePlaylistDto extends UpdatePlaylistDto_base {
	id: number;
}
export {};
