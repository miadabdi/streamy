import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import { Tag, User } from '../drizzle/schema';
import { VideoService } from '../video/video.service';
import { CreateTagDto, DeleteTagDto } from './dto';
import { AddTagsToVideoDto } from './dto/add-tags-to-videos.dto';
export declare class TagService {
	private drizzleService;
	private videoService;
	private logger;
	constructor(drizzleService: DrizzleService, videoService: VideoService);
	createTag(createTagDto: CreateTagDto, user: User): Promise<Tag>;
	addTagsToVideo(
		addTagsToVideoDto: AddTagsToVideoDto,
		user: User,
		tx?: TransactionType,
	): Promise<{
		message: string;
	}>;
	getTagById(id: number): Promise<Tag>;
	deleteTag(
		deleteTagDto: DeleteTagDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	getTags(): import('drizzle-orm/pg-core/query-builders/query').PgRelationalQuery<
		{
			id: number;
			createdAt: Date;
			updatedAt: Date;
			isActive: boolean;
			deletedAt: Date;
			title: string;
		}[]
	>;
}
