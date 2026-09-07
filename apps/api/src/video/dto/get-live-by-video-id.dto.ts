import { IsString } from 'class-validator';

export class GetLiveByVideoIdDto {
	@IsString()
	videoId: string;
}
