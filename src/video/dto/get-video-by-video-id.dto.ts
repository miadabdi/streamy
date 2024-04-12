import { IsString } from 'class-validator';

export class GetVideoByVideoIdDto {
	@IsString()
	videoId: string;
}
