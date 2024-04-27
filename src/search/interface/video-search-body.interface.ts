import { Video } from '../../drizzle/schema';

export interface VideoSearchBody
	extends Pick<
		Video,
		| 'id'
		| 'channelId'
		| 'description'
		| 'name'
		| 'duration'
		| 'numberOfDislikes'
		| 'numberOfLikes'
		| 'numberOfVisits'
		| 'releasedAt'
	> {}
