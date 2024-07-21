import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { User } from '../drizzle/schema';
import { AddTagsToVideoDto, CreateTagDto, DeleteTagDto, GetTagByIdDto } from './dto';
import { TagService } from './tags.service';

@Controller('/tag')
@UseGuards(JwtAuthGuard)
export class TagController {
	constructor(private tagService: TagService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createTag(@Body() createTagDto: CreateTagDto, @GetUser() user: User) {
		return this.tagService.createTag(createTagDto, user);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('/add-tags-to-video')
	addTagsToVideo(@Body() addTagsToVideoDto: AddTagsToVideoDto, @GetUser() user: User) {
		return this.tagService.addTagsToVideo(addTagsToVideoDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-id')
	getTagById(@Query() getTagByIdDto: GetTagByIdDto, @GetUser() user: User) {
		return this.tagService.getTagById(getTagByIdDto.id);
	}

	@HttpCode(HttpStatus.OK)
	@Get()
	getTags(@GetUser() user: User) {
		return this.tagService.getTags();
	}

	@HttpCode(HttpStatus.OK)
	@Delete()
	deleteTag(@Query() deleteTagDto: DeleteTagDto, @GetUser() user: User) {
		return this.tagService.deleteTag(deleteTagDto, user);
	}
}
