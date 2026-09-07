export declare enum ILikeType {
	like = 'like',
	dislike = 'dislike',
	unlike = 'unlike',
	undislike = 'undislike',
}
export declare class LikeDislikeVideoDto {
	type: ILikeType;
	videoId: number;
	likerChannelId: number;
}
