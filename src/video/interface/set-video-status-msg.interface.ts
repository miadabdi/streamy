import { TVideoProccessingStatusEnum } from '../../drizzle/schema';

export interface SetVideoStatusMsg {
	videoId: number;
	status: TVideoProccessingStatusEnum;
	logs: string;
}
