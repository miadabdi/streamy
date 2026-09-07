import { TVideoTypeEnum } from '../../drizzle/schema';
export declare class GetVideosDto {
	offset: number;
	limit: number;
	channelId: number;
	includeNotReleased: boolean;
	onlySubbed: boolean;
	type: TVideoTypeEnum;
}
