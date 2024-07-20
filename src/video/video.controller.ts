import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	ParseIntPipe,
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
import { DrizzleService } from '../drizzle/drizzle.service';
import { User, Video } from '../drizzle/schema';
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
import { GetVideosDto } from './dto/get-videos';
import { VideoService } from './video.service';

@Controller('/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
	constructor(
		private videoService: VideoService,
		private drizzleService: DrizzleService,
	) {}

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
	async createVideo(@Body() createVideoDto: CreateVideoDto, @GetUser() user: User) {
		let video: Video;

		await this.drizzleService.db.transaction(async (tx) => {
			video = await this.videoService.createVideo(createVideoDto, user, tx);
		});

		return video;
	}

	@HttpCode(HttpStatus.OK)
	@Get('/live-by-video-id')
	@Public()
	getLiveByVideoId(@Query() getLiveByVideoIdDto: GetLiveByVideoIdDto) {
		return this.videoService.getLiveByVideoId(getLiveByVideoIdDto.videoId);
	}

	@HttpCode(HttpStatus.OK)
	@Post('/release')
	releaseVideo(@Body('id', ParseIntPipe) id: number, @GetUser() user: User) {
		return this.videoService.releaseVideo(id, user);
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

	@HttpCode(HttpStatus.OK)
	@Get()
	getAllVideos(@Query() getVideosDto: GetVideosDto, @GetUser() user: User) {
		return this.videoService.getAllVideos(getVideosDto, user);
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
