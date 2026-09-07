import { TVideoTypeEnum } from '../../drizzle/schema';
export declare class SearchVideosDto {
	offset: number;
	limit: number;
	channelId: number;
	onlySubbed: boolean;
	type: TVideoTypeEnum;
	text: string;
}
