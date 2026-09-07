import { TVideoTypeEnum } from '../../drizzle/schema';
export declare class CreateVideoDto {
	name: string;
	description: string;
	channelId: number;
	type: TVideoTypeEnum;
	tagIds: number[];
}
