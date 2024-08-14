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
import { LikeDislikeVideoDto } from './dto/like-dislike-video.dto';
import { SearchVideosDto } from './dto/search-videos.dto';
import { WatchedVideoDto } from './dto/watched-video.dto';
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
	@Post('/like-dislike')
	async likeDislikeVideo(@Body() likeDislikeVideoDto: LikeDislikeVideoDto, @GetUser() user: User) {
		let result;

		await this.drizzleService.db.transaction(async (tx) => {
			result = await this.videoService.likeDislikeVideo(likeDislikeVideoDto, user, tx);
		});

		return result;
	}

	@HttpCode(HttpStatus.CREATED)
	@Post('/watched')
	async watchedVideo(@Body() watchedVideoDto: WatchedVideoDto, @GetUser() user: User) {
		let result;

		await this.drizzleService.db.transaction(async (tx) => {
			result = await this.videoService.watchedVideo(watchedVideoDto, user, tx);
		});

		return result;
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
		@UploadedFile(new SharpPipe({ width: 1280, height: 720 })) thumbnail: Express.Multer.File,
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

	@HttpCode(HttpStatus.OK)
	@Get('/my-channels')
	getAllVideosOfMyChannel(@Query() getVideosDto: GetVideosDto, @GetUser() user: User) {
		return this.videoService.getAllVideosOfMyChannel(getVideosDto, user);
	}

	@HttpCode(HttpStatus.OK)
	@Get('/search')
	search(@Query() searchVideosDto: SearchVideosDto, @GetUser() user: User) {
		return this.videoService.search(searchVideosDto, user);
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
