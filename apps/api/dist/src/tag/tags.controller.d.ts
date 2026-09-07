import { User } from '../drizzle/schema';
import { AddTagsToVideoDto, CreateTagDto, DeleteTagDto, GetTagByIdDto } from './dto';
import { TagService } from './tags.service';
export declare class TagController {
	private tagService;
	constructor(tagService: TagService);
	createTag(
		createTagDto: CreateTagDto,
		user: User,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		title: string;
	}>;
	addTagsToVideo(
		addTagsToVideoDto: AddTagsToVideoDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	getTagById(
		getTagByIdDto: GetTagByIdDto,
		user: User,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		title: string;
	}>;
	getTags(user: User): import('drizzle-orm/pg-core/query-builders/query').PgRelationalQuery<
		{
			id: number;
			createdAt: Date;
			updatedAt: Date;
			isActive: boolean;
			deletedAt: Date;
			title: string;
		}[]
	>;
	deleteTag(
		deleteTagDto: DeleteTagDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
