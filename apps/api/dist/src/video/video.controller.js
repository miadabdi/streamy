'use strict';
var __decorate =
	(this && this.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
			r = Reflect.decorate(decorators, target, key, desc);
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return (c > 3 && r && Object.defineProperty(target, key, r), r);
	};
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
var __param =
	(this && this.__param) ||
	function (paramIndex, decorator) {
		return function (target, key) {
			decorator(target, key, paramIndex);
		};
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.VideoController = void 0;
const common_1 = require('@nestjs/common');
const platform_express_1 = require('@nestjs/platform-express');
const decorators_1 = require('../common/decorators');
const public_decorator_1 = require('../common/decorators/public.decorator');
const guards_1 = require('../common/guards');
const sharp_pipe_pipe_1 = require('../common/pipes/sharp-pipe.pipe');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const dto_1 = require('./dto');
const get_video_presigned_put_url_dto_1 = require('./dto/get-video-presigned-put-url.dto');
const get_videos_1 = require('./dto/get-videos');
const like_dislike_video_dto_1 = require('./dto/like-dislike-video.dto');
const search_videos_dto_1 = require('./dto/search-videos.dto');
const watched_video_dto_1 = require('./dto/watched-video.dto');
const video_service_1 = require('./video.service');
let VideoController = class VideoController {
	constructor(videoService, drizzleService) {
		this.videoService = videoService;
		this.drizzleService = drizzleService;
	}
	confirmUpload(confirmVideoUploadDto, user) {
		return this.videoService.confirmUpload(confirmVideoUploadDto.id, user);
	}
	sendVideoInProcessQueue(sendVideoInProcessQueueDto, user) {
		return this.videoService.sendVideoInProcessQueue(sendVideoInProcessQueueDto, user);
	}
	async likeDislikeVideo(likeDislikeVideoDto, user) {
		let result;
		await this.drizzleService.db.transaction(async (tx) => {
			result = await this.videoService.likeDislikeVideo(likeDislikeVideoDto, user, tx);
		});
		return result;
	}
	async watchedVideo(watchedVideoDto, user) {
		let result;
		await this.drizzleService.db.transaction(async (tx) => {
			result = await this.videoService.watchedVideo(watchedVideoDto, user, tx);
		});
		return result;
	}
	async createVideo(createVideoDto, user) {
		let video;
		await this.drizzleService.db.transaction(async (tx) => {
			video = await this.videoService.createVideo(createVideoDto, user, tx);
		});
		return video;
	}
	getLiveByVideoId(getLiveByVideoIdDto) {
		return this.videoService.getLiveByVideoId(getLiveByVideoIdDto.videoId);
	}
	releaseVideo(id, user) {
		return this.videoService.releaseVideo(id, user);
	}
	updateVideo(updateVideoDto, user) {
		return this.videoService.updateVideo(updateVideoDto, user);
	}
	setVideoThumbnail(setVideoThumbnailDto, user, thumbnail) {
		return this.videoService.setVideoThumbnail(setVideoThumbnailDto, user, thumbnail);
	}
	getVideoById(getVideoByIdDto, user) {
		return this.videoService.getVideoById(getVideoByIdDto.id);
	}
	getVideoByVideoId(getVideoByVideoIdDto, user) {
		return this.videoService.getVideoByVideoId(getVideoByVideoIdDto.videoId);
	}
	getAllVideos(getVideosDto, user) {
		return this.videoService.getAllVideos(getVideosDto, user);
	}
	getAllVideosOfMyChannel(getVideosDto, user) {
		return this.videoService.getAllVideosOfMyChannel(getVideosDto, user);
	}
	search(searchVideosDto, user) {
		return this.videoService.search(searchVideosDto, user);
	}
	async getPresignedPutURL(getVideoPresignedPutURLDto, user) {
		return this.videoService.getPresignedPutURL(getVideoPresignedPutURLDto, user);
	}
	deleteVideo(deleteVideoDto, user) {
		return this.videoService.deleteVideo(deleteVideoDto, user);
	}
};
exports.VideoController = VideoController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/confirm-upload'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.ConfirmVideoUploadDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'confirmUpload',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/send-video-to-process-queue'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.SendVideoToProcessQueueDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'sendVideoInProcessQueue',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/like-dislike'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [like_dislike_video_dto_1.LikeDislikeVideoDto, Object]),
		__metadata('design:returntype', Promise),
	],
	VideoController.prototype,
	'likeDislikeVideo',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/watched'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [watched_video_dto_1.WatchedVideoDto, Object]),
		__metadata('design:returntype', Promise),
	],
	VideoController.prototype,
	'watchedVideo',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.CreateVideoDto, Object]),
		__metadata('design:returntype', Promise),
	],
	VideoController.prototype,
	'createVideo',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/live-by-video-id'),
		(0, public_decorator_1.Public)(),
		__param(0, (0, common_1.Query)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetLiveByVideoIdDto]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'getLiveByVideoId',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/release'),
		__param(0, (0, common_1.Body)('id', common_1.ParseIntPipe)),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [Number, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'releaseVideo',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.UpdateVideoDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'updateVideo',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)('/set-thumbnail'),
		(0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('thumbnail')),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__param(
			2,
			(0, common_1.UploadedFile)(new sharp_pipe_pipe_1.SharpPipe({ width: 1280, height: 720 })),
		),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.SetVideoThumbnailDto, Object, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'setVideoThumbnail',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetVideoByIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'getVideoById',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-video-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetVideoByVideoIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'getVideoByVideoId',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)(),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [get_videos_1.GetVideosDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'getAllVideos',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/my-channels'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [get_videos_1.GetVideosDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'getAllVideosOfMyChannel',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/search'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [search_videos_dto_1.SearchVideosDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'search',
	null,
);
__decorate(
	[
		(0, common_1.Get)('/get-presigned-put-url'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [
			get_video_presigned_put_url_dto_1.GetVideoPresignedPutURLDto,
			Object,
		]),
		__metadata('design:returntype', Promise),
	],
	VideoController.prototype,
	'getPresignedPutURL',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Delete)(),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteVideoDto, Object]),
		__metadata('design:returntype', void 0),
	],
	VideoController.prototype,
	'deleteVideo',
	null,
);
exports.VideoController = VideoController = __decorate(
	[
		(0, common_1.Controller)('/video'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [
			video_service_1.VideoService,
			drizzle_service_1.DrizzleService,
		]),
	],
	VideoController,
);
//# sourceMappingURL=video.controller.js.map
