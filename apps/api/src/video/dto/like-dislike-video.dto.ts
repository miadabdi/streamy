import { Type } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';

export enum ILikeType {
	like = 'like',
	dislike = 'dislike',
	unlike = 'unlike',
	undislike = 'undislike',
}

export class LikeDislikeVideoDto {
	@IsEnum(ILikeType)
	type: ILikeType;

	@IsInt()
	@Type(() => Number)
	videoId: number;

	@IsInt()
	@Type(() => Number)
	likerChannelId: number;
}
