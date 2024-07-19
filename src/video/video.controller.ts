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
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards';
import { SharpPipe } from '../common/pipes/sharp-pipe.pipe';
import { User } from '../drizzle/schema';
import {
	CreateVideoDto,
	DeleteVideoDto,
	GetLiveByVideoIdDto,
	GetVideoByIdDto,
	GetVideoByVideoIdDto,
	SendVideoToProcessQueueDto,
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
	@Post('/send-video-to-process-queue')
	sendVideoInProcessQueue(
		@Query() sendVideoInProcessQueueDto: SendVideoToProcessQueueDto,
		@GetUser() user: User,
	) {
		return this.videoService.sendVideoInProcessQueue(sendVideoInProcessQueueDto, user);
	}

	@HttpCode(HttpStatus.CREATED)
	@Post()
	createVideo(@Body() createVideoDto: CreateVideoDto, @GetUser() user: User) {
		return this.videoService.createVideo(createVideoDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/live-by-video-id')
	@Public()
	getLiveByVideoId(@Query() getLiveByVideoIdDto: GetLiveByVideoIdDto) {
		return this.videoService.getLiveByVideoId(getLiveByVideoIdDto.videoId);
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
		@UploadedFile(new SharpPipe({ width: 1080, height: 1920 })) thumbnail: Express.Multer.File,
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
