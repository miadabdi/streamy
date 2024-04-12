import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { User } from '../drizzle/schema';
import {
	CreateSubtitleDto,
	DeleteSubtitleDto,
	GetSubtitleByIdDto,
	GetSubtitleByVideoIdDto,
	UpdateSubtitleDto,
} from './dto';
import { SubtitleService } from './subtitle.service';

@Controller('/subtitle')
@UseGuards(JwtAuthGuard)
export class SubtitleController {
	constructor(private subtitleService: SubtitleService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	@UseInterceptors(FileInterceptor('file'))
	createSubtitle(
		@Body() createSubtitleDto: CreateSubtitleDto,
		@UploadedFile() file: Express.Multer.File,
		@GetUser() user: User,
	) {
		return this.subtitleService.createSubtitle(createSubtitleDto, file, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch()
	updateSubtitle(@Body() updateSubtitleDto: UpdateSubtitleDto, @GetUser() user: User) {
		return this.subtitleService.updateSubtitle(updateSubtitleDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-id')
	getSubtitleById(@Query() getSubtitleByIdDto: GetSubtitleByIdDto, @GetUser() user: User) {
		return this.subtitleService.getSubtitleById(getSubtitleByIdDto.id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-language-rfc5646/:identifier')
	getLanguageOfRFC5646(@Param('identifier') identifier: string, @GetUser() user: User) {
		return this.subtitleService.getLanguageOfRFC5646(identifier, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-video-id')
	getSubtitleByVideoId(
		@Query() getSubtitleByVideoIdDto: GetSubtitleByVideoIdDto,
		@GetUser() user: User,
	) {
		return this.subtitleService.getSubtitleByVideoId(getSubtitleByVideoIdDto.videoId);
	}

	@HttpCode(HttpStatus.OK)
	@Delete()
	deleteSubtitle(@Query() deleteSubtitleDto: DeleteSubtitleDto, @GetUser() user: User) {
		return this.subtitleService.deleteSubtitle(deleteSubtitleDto, user);
	}
}
