import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
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
import { SharpPipe } from '../common/pipes/sharp-pipe.pipe';
import { User } from '../drizzle/schema';
import {
	CreateVideoDto,
	DeleteVideoDto,
	GetVideoByIdDto,
	GetVideoByVideoIdDto,
	SetVideoThumbnailDto,
	UpdateVideoDto,
} from './dto';
import { GetVideoPresignedPutURLDto } from './dto/get-video-presigned-put-url.dto';
import { VideoService } from './video.service';

@Controller('/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
	constructor(private videoService: VideoService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createVideo(@Body() createVideoDto: CreateVideoDto, @GetUser() user: User) {
		return this.videoService.createVideo(createVideoDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch()
	updateVideo(@Body() updateVideoDto: UpdateVideoDto, @GetUser() user: User) {
		return this.videoService.updateVideo(updateVideoDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Patch('/set-thumbnail')
	@UseInterceptors(FileInterceptor('thumbnail'))
	setVideoThumbnail(
		@Body() setVideoThumbnailDto: SetVideoThumbnailDto,
		@GetUser() user: User,
		@UploadedFile(SharpPipe) thumbnail: Express.Multer.File,
	) {
		return this.videoService.setVideoThumbnail(setVideoThumbnailDto, user, thumbnail);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-id')
	getVideoById(@Query() getVideoByIdDto: GetVideoByIdDto, @GetUser() user: User) {
		return this.videoService.getVideoById(getVideoByIdDto.id);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/by-video-id')
	getVideoByVideoId(@Query() getVideoByVideoIdDto: GetVideoByVideoIdDto, @GetUser() user: User) {
		return this.videoService.getVideoByVideoId(getVideoByVideoIdDto.videoId);
	}

	@Get('/get-presigned-put-url')
	@UseGuards(JwtAuthGuard)
	async getPresignedPutURL(
		@Query() getVideoPresignedPutURLDto: GetVideoPresignedPutURLDto,
		@GetUser() user: User,
	) {
		return this.videoService.getPresignedPutURL(getVideoPresignedPutURLDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Delete()
	deleteVideo(@Query() deleteVideoDto: DeleteVideoDto, @GetUser() user: User) {
		return this.videoService.deleteVideo(deleteVideoDto, user);
	}
}
