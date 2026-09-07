import { TPlaylistPrivacyEnum, TPlaylistTypeEnum } from '../../drizzle/schema';
export declare class CreatePlaylistDto {
	name: string;
	description: string;
	channelId: number;
	privacy?: TPlaylistPrivacyEnum;
	type?: TPlaylistTypeEnum;
}
