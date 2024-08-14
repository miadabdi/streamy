import { Video } from '../../drizzle/schema';

type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;

export interface VideoSearchBody
	extends OptionalExceptFor<
		Pick<
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
		>,
		'id'
	> {}
