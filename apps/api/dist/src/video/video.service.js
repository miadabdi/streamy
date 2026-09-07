'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
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
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
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
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
var VideoService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.VideoService = void 0;
const common_1 = require('@nestjs/common');
const crypto_1 = require('crypto');
const drizzle_orm_1 = require('drizzle-orm');
const channel_service_1 = require('../channel/channel.service');
const decorators_1 = require('../common/decorators');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const file_service_1 = require('../file/file.service');
const minio_client_service_1 = require('../minio-client/minio-client.service');
const playlist_service_1 = require('../playlist/playlist.service');
const consumer_service_1 = require('../queue/consumer.service');
const producer_service_1 = require('../queue/producer.service');
const video_search_service_1 = __importDefault(require('../search/video-search.service'));
const tags_service_1 = require('../tag/tags.service');
const dto_1 = require('./dto');
const get_videos_1 = require('./dto/get-videos');
const like_dislike_video_dto_1 = require('./dto/like-dislike-video.dto');
let VideoService = (VideoService_1 = class VideoService {
	constructor(
		drizzleService,
		fileService,
		channelService,
		producerService,
		consumerService,
		tagService,
		playlistService,
		videoSearchService,
		minioClientService,
	) {
		this.drizzleService = drizzleService;
		this.fileService = fileService;
		this.channelService = channelService;
		this.producerService = producerService;
		this.consumerService = consumerService;
		this.tagService = tagService;
		this.playlistService = playlistService;
		this.videoSearchService = videoSearchService;
		this.minioClientService = minioClientService;
		this.logger = new common_1.Logger(VideoService_1.name);
	}
	onModuleInit() {
		this.consumerService.listenOnQueue('q.set.video.status', this.consumeSetStatusMsg.bind(this));
	}
	async sendVideoProcessRMQMsg(payload) {
		await this.producerService.addToQueue('q.video.process', payload);
	}
	async search(searchVideosDto, user) {
		const result = await this.videoSearchService.search(searchVideosDto.text);
		const videoIds = result.map((res) => res.id);
		if (videoIds.length == 0) return [];
		const andArr = [
			(0, drizzle_orm_1.inArray)(schema.videos.id, videoIds),
			(0, drizzle_orm_1.eq)(schema.videos.isReleased, true),
			(0, drizzle_orm_1.eq)(schema.videos.type, searchVideosDto.type),
		];
		if (searchVideosDto.channelId) {
			andArr.push((0, drizzle_orm_1.eq)(schema.videos.channelId, searchVideosDto.channelId));
		}
		if (searchVideosDto.onlySubbed) {
			const subbed = await this.drizzleService.db
				.select()
				.from(schema.subscriptions)
				.where((0, drizzle_orm_1.eq)(schema.subscriptions.followerId, user.currentChannelId))
				.execute();
			const subbedChannelIds = subbed.map((sub) => sub.followeeId);
			if (subbedChannelIds.length == 0) {
				return [];
			}
			andArr.push((0, drizzle_orm_1.inArray)(schema.videos.channelId, subbedChannelIds));
		}
		return this.drizzleService.db.query.videos.findMany({
			where: (0, drizzle_orm_1.and)(...andArr),
			limit: searchVideosDto.limit,
			offset: searchVideosDto.offset,
			orderBy: [
				(0, drizzle_orm_1.desc)(schema.videos.releasedAt),
				(0, drizzle_orm_1.desc)(schema.videos.createdAt),
			],
			with: {
				channel: true,
				thumbnailFile: true,
				videoFile: true,
			},
		});
	}
	async consumeSetStatusMsg(message) {
		await this.drizzleService.db
			.update(schema.videos)
			.set({ processingStatus: message.status, ffmpegProcessLogs: message.logs })
			.where((0, drizzle_orm_1.eq)(schema.videos.id, message.videoId));
	}
	async confirmUpload(id, user) {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.videos.id, id),
			with: {
				channel: true,
				videoFile: true,
			},
		});
		if (!video) {
			throw new common_1.NotFoundException(`Video with id ${id} not found`);
		}
		if (video.channel.ownerId !== user.id) {
			throw new common_1.ForbiddenException(`You don't own video with id ${id}`);
		}
		if (!video.videoFile) {
			throw new common_1.BadRequestException(
				`Video with id ${id} has no file attached; request a presigned upload url first`,
			);
		}
		let stat;
		try {
			stat = await this.minioClientService.client.statObject(
				video.videoFile.bucketName,
				video.videoFile.path,
			);
		} catch (err) {
			this.logger.warn(`confirmUpload: statObject failed for video ${id}: ${err.message}`);
			throw new common_1.NotFoundException(
				`File of video with id ${id} not found in object storage; upload may not have completed`,
			);
		}
		const mimetype =
			stat.metaData?.['content-type'] ??
			stat.metaData?.['Content-Type'] ??
			'application/octet-stream';
		await this.markVideoFileUploaded(
			video.videoFile.bucketName,
			video.videoFile.path,
			stat.size,
			mimetype,
		);
		return { message: 'Upload confirmed successfully' };
	}
	async markVideoFileUploaded(bucketName, filePath, sizeInByte, mimetype) {
		this.logger.debug(
			`Video file uploaded: bucketName: ${bucketName}, filePath: ${filePath}, sizeInByte=${sizeInByte}, mimetype=${mimetype}`,
		);
		const fileRecord = await this.drizzleService.db.query.files.findFirst({
			where: (0, drizzle_orm_1.and)(
				(0, drizzle_orm_1.eq)(schema.files.bucketName, bucketName),
				(0, drizzle_orm_1.eq)(schema.files.path, filePath),
			),
		});
		if (fileRecord) {
			await this.drizzleService.db
				.update(schema.files)
				.set({ sizeInByte, mimetype })
				.where(
					(0, drizzle_orm_1.and)(
						(0, drizzle_orm_1.eq)(schema.files.bucketName, bucketName),
						(0, drizzle_orm_1.eq)(schema.files.path, filePath),
					),
				)
				.execute();
			await this.drizzleService.db
				.update(schema.videos)
				.set({ processingStatus: schema.VideoProccessingStatusEnum.ready_for_processing })
				.where((0, drizzle_orm_1.eq)(schema.videos.videoFileId, fileRecord.id))
				.execute();
			this.logger.debug(
				`Video file uploaded: Done, bucketName: ${bucketName}, filePath: ${filePath}`,
			);
		} else {
			this.logger.warn(
				`Video file uploaded: fileRecord not found, bucketName: ${bucketName}, filePath: ${filePath}`,
			);
		}
	}
	async userOwnsVideo(id, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const video = await manager.query.videos.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.videos.id, id),
			with: {
				channel: true,
			},
		});
		if (!video) {
			throw new common_1.NotFoundException(`Video with id ${id} not found`);
		}
		if (video.channel.ownerId !== user.id) {
			throw new common_1.ForbiddenException(`You don't own video with id ${id}`);
		}
		return video;
	}
	async generateVideoId() {
		while (true) {
			const id = (0, crypto_1.randomBytes)(8).toString('hex');
			const dupVideo = await this.drizzleService.db.query.videos.findFirst({
				where: (0, drizzle_orm_1.eq)(schema.videos.videoId, id),
			});
			if (!dupVideo) return id;
		}
	}
	async sendVideoInProcessQueue(sendVideoToProcessQueueDto, user) {
		await this.userOwnsVideo(sendVideoToProcessQueueDto.id, user);
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.videos.id, sendVideoToProcessQueueDto.id),
			with: {
				videoFile: true,
				subtitles: {
					with: {
						file: true,
					},
				},
			},
		});
		if (video.processingStatus != schema.VideoProccessingStatusEnum.ready_for_processing) {
			throw new common_1.BadRequestException(
				`Video is not in ready_for_processing state, current state: ${video.processingStatus}`,
			);
		}
		await this.sendVideoProcessRMQMsg({
			videoId: video.id,
			fileId: video.videoFile.id,
			bucketName: video.videoFile.bucketName,
			filePath: video.videoFile.path,
			sizeInByte: video.videoFile.sizeInByte,
			mimetype: video.videoFile.mimetype,
			subs: video.subtitles.map((sub) => {
				return {
					id: sub.id,
					langRFC5646: sub.langRFC5646,
					fileId: sub.file.id,
					filePath: sub.file.path,
					bucketName: sub.file.bucketName,
					sizeInByte: sub.file.sizeInByte,
					mimetype: sub.file.mimetype,
				};
			}),
		});
		await this.drizzleService.db
			.update(schema.videos)
			.set({
				processingStatus: schema.VideoProccessingStatusEnum.waiting_in_queue,
			})
			.where((0, drizzle_orm_1.eq)(schema.videos.id, sendVideoToProcessQueueDto.id))
			.execute();
		return {
			message: 'Video sent to process queue successfully',
		};
	}
	async getAllVideosOfMyChannel(getVideosDto, user) {
		console.log(getVideosDto);
		const andArr = [(0, drizzle_orm_1.eq)(schema.videos.type, getVideosDto.type)];
		if (getVideosDto.channelId) {
			andArr.push((0, drizzle_orm_1.eq)(schema.videos.channelId, getVideosDto.channelId));
		}
		const owned = await this.drizzleService.db
			.select()
			.from(schema.channels)
			.where((0, drizzle_orm_1.eq)(schema.channels.ownerId, user.id))
			.execute();
		const ownedChannelIds = owned.map((channel) => channel.id);
		andArr.push((0, drizzle_orm_1.inArray)(schema.videos.channelId, ownedChannelIds));
		return this.drizzleService.db.query.videos.findMany({
			where: (0, drizzle_orm_1.and)(...andArr),
			limit: getVideosDto.limit,
			offset: getVideosDto.offset,
			orderBy: [
				(0, drizzle_orm_1.desc)(schema.videos.releasedAt),
				(0, drizzle_orm_1.desc)(schema.videos.createdAt),
			],
			with: {
				channel: true,
				thumbnailFile: true,
				videoFile: true,
			},
		});
	}
	async getAllVideos(getVideosDto, user) {
		console.log(getVideosDto);
		const andArr = [
			(0, drizzle_orm_1.eq)(schema.videos.isReleased, true),
			(0, drizzle_orm_1.eq)(schema.videos.type, getVideosDto.type),
		];
		if (getVideosDto.channelId) {
			andArr.push((0, drizzle_orm_1.eq)(schema.videos.channelId, getVideosDto.channelId));
		}
		if (getVideosDto.onlySubbed) {
			const subbed = await this.drizzleService.db
				.select()
				.from(schema.subscriptions)
				.where((0, drizzle_orm_1.eq)(schema.subscriptions.followerId, user.currentChannelId))
				.execute();
			const subbedChannelIds = subbed.map((sub) => sub.followeeId);
			if (subbedChannelIds.length == 0) {
				return [];
			}
			andArr.push((0, drizzle_orm_1.inArray)(schema.videos.channelId, subbedChannelIds));
		}
		return this.drizzleService.db.query.videos.findMany({
			where: (0, drizzle_orm_1.and)(...andArr),
			limit: getVideosDto.limit,
			offset: getVideosDto.offset,
			orderBy: [
				(0, drizzle_orm_1.desc)(schema.videos.releasedAt),
				(0, drizzle_orm_1.desc)(schema.videos.createdAt),
			],
			with: {
				channel: true,
				thumbnailFile: true,
				videoFile: true,
			},
		});
	}
	async releaseVideo(id, user) {
		const video = await this.userOwnsVideo(id, user);
		if (video.processingStatus != schema.VideoProccessingStatusEnum.done) {
			throw new common_1.ForbiddenException('Video status is not set to done');
		}
		const { ...returningKeys } = table_columns_1.videosTableColumns;
		const releaseDate = new Date();
		const updatedVideos = await this.drizzleService.db
			.update(schema.videos)
			.set({ isReleased: true, releasedAt: releaseDate })
			.where((0, drizzle_orm_1.eq)(schema.videos.id, id))
			.returning(returningKeys)
			.execute();
		const updatedVideo = updatedVideos[0];
		await this.updateIndexVideo(updatedVideo.id);
		return {
			message: 'Video released successfully',
		};
	}
	async createVideo(createVideoDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		await this.channelService.userOwnsChannel(createVideoDto.channelId, user, tx);
		const videoId = await this.generateVideoId();
		const { ...returningKeys } = table_columns_1.videosTableColumns;
		const videoRes = await manager
			.insert(schema.videos)
			.values({
				...createVideoDto,
				videoId,
				processingStatus:
					createVideoDto.type === schema.videoTypeEnum.vod
						? schema.VideoProccessingStatusEnum.ready_for_upload
						: schema.VideoProccessingStatusEnum.ready_for_processing,
			})
			.returning(returningKeys)
			.execute();
		const video = videoRes[0];
		if (createVideoDto.tagIds && createVideoDto.tagIds.length > 0) {
			await this.tagService.addTagsToVideo(
				{
					tagIds: createVideoDto.tagIds,
					videoId: video.id,
				},
				user,
				tx,
			);
		}
		await this.videoSearchService.indexVideo({
			id: video.id,
			name: video.name,
			description: video.description,
		});
		return video;
	}
	async setVideoThumbnail(setVideoThumbnailDto, user, thumbnail) {
		await this.userOwnsVideo(setVideoThumbnailDto.id, user);
		const file = await this.fileService.uploadAndCreateFileRecord(
			thumbnail,
			'',
			'videothumbnails',
			user,
		);
		const videoUpdateRes = await this.drizzleService.db
			.update(schema.videos)
			.set({
				thumbnailFileId: file.id,
			})
			.where((0, drizzle_orm_1.eq)(schema.videos.id, setVideoThumbnailDto.id))
			.execute();
		return file;
	}
	async updateVideo(updateVideoDto, user) {
		await this.userOwnsVideo(updateVideoDto.id, user);
		const { ...returningKeys } = table_columns_1.videosTableColumns;
		const updatedVideos = await this.drizzleService.db
			.update(schema.videos)
			.set({
				...updateVideoDto,
			})
			.where((0, drizzle_orm_1.eq)(schema.videos.id, updateVideoDto.id))
			.returning(returningKeys)
			.execute();
		const updatedVideo = updatedVideos[0];
		await this.videoSearchService.indexVideo({
			id: updatedVideo.id,
			name: updatedVideo.name,
			description: updatedVideo.description,
		});
		return updatedVideo;
	}
	async watchedVideo(watchedVideoDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const playlistOfChannel = await this.playlistService.getPlaylistsOfChannel(
			watchedVideoDto.watcherChannelId,
		);
		const watchPlaylist = playlistOfChannel.find(
			(playlist) => playlist.type == schema.PlaylistTypeEnum.watched,
		);
		if (!watchPlaylist) {
			throw new common_1.BadRequestException('Watched playlist for your channel does not exists');
		}
		await this.playlistService.addVideos(
			{
				videoIds: [watchedVideoDto.videoId],
				playlistId: watchPlaylist.id,
			},
			user,
			tx,
		);
		await manager
			.update(schema.videos)
			.set({
				numberOfVisits: (0, drizzle_orm_1.sql)`${schema.videos.numberOfVisits} + 1`,
			})
			.where((0, drizzle_orm_1.eq)(schema.videos.id, watchedVideoDto.videoId))
			.execute();
		return {
			message: 'Operation done successfully.',
		};
	}
	async likeDislikeVideo(likeDislikeVideoDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const playlistOfChannel = await this.playlistService.getPlaylistsOfChannel(
			likeDislikeVideoDto.likerChannelId,
		);
		if (likeDislikeVideoDto.type == like_dislike_video_dto_1.ILikeType.like) {
			const likePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.likes,
			);
			if (!likePlaylist) {
				throw new common_1.BadRequestException('Like playlist for your channel does not exists');
			}
			await this.playlistService.addVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: likePlaylist.id,
				},
				user,
				tx,
			);
			await manager
				.update(schema.videos)
				.set({
					numberOfLikes: (0, drizzle_orm_1.sql)`${schema.videos.numberOfLikes} + 1`,
				})
				.where((0, drizzle_orm_1.eq)(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		} else if (likeDislikeVideoDto.type == like_dislike_video_dto_1.ILikeType.dislike) {
			const dislikePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.dislikes,
			);
			if (!dislikePlaylist) {
				throw new common_1.BadRequestException('Dislike playlist for your channel does not exists');
			}
			await this.playlistService.addVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: dislikePlaylist.id,
				},
				user,
				tx,
			);
			await manager
				.update(schema.videos)
				.set({
					numberOfDislikes: (0, drizzle_orm_1.sql)`${schema.videos.numberOfDislikes} + 1`,
				})
				.where((0, drizzle_orm_1.eq)(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		} else if (likeDislikeVideoDto.type == like_dislike_video_dto_1.ILikeType.unlike) {
			const likePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.likes,
			);
			if (!likePlaylist) {
				throw new common_1.BadRequestException('Like playlist for your channel does not exists');
			}
			await this.playlistService.removeVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: likePlaylist.id,
				},
				user,
				tx,
			);
			await manager
				.update(schema.videos)
				.set({
					numberOfLikes: (0, drizzle_orm_1.sql)`${schema.videos.numberOfLikes} - 1`,
				})
				.where((0, drizzle_orm_1.eq)(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		} else if (likeDislikeVideoDto.type == like_dislike_video_dto_1.ILikeType.undislike) {
			const dislikePlaylist = playlistOfChannel.find(
				(playlist) => playlist.type == schema.PlaylistTypeEnum.dislikes,
			);
			if (!dislikePlaylist) {
				throw new common_1.BadRequestException('Like playlist for your channel does not exists');
			}
			await this.playlistService.removeVideos(
				{
					videoIds: [likeDislikeVideoDto.videoId],
					playlistId: dislikePlaylist.id,
				},
				user,
				tx,
			);
			await manager
				.update(schema.videos)
				.set({
					numberOfDislikes: (0, drizzle_orm_1.sql)`${schema.videos.numberOfDislikes} - 1`,
				})
				.where((0, drizzle_orm_1.eq)(schema.videos.id, likeDislikeVideoDto.videoId))
				.execute();
		}
		return {
			message: 'Operation done successfully.',
		};
	}
	async getVideoByVideoId(videoId) {
		return this.drizzleService.db.query.videos.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.videos.videoId, videoId),
			with: {
				videosToTags: {
					with: {
						tag: true,
					},
				},
				subtitles: true,
				videoFile: true,
				thumbnailFile: true,
				comments: {
					with: {
						owner: {
							with: {
								avatar: true,
							},
						},
					},
				},
				channel: {
					with: {
						avatar: true,
					},
				},
			},
		});
	}
	getLiveByVideoId(videoId) {
		return this.drizzleService.db.query.videos.findFirst({
			where: (0, drizzle_orm_1.and)(
				(0, drizzle_orm_1.eq)(schema.videos.videoId, videoId),
				(0, drizzle_orm_1.eq)(schema.videos.type, schema.videoTypeEnum.live),
				(0, drizzle_orm_1.eq)(schema.videos.isActive, true),
			),
		});
	}
	async getPresignedPutURL(getVideoPresignedPutURLDto, user) {
		const { url, fileRecord } = await this.fileService.getPresignedPutURL(
			{
				bucket: 'videos',
				path: getVideoPresignedPutURLDto.path,
			},
			user,
		);
		await this.drizzleService.db
			.update(schema.videos)
			.set({ videoFileId: fileRecord.id })
			.where((0, drizzle_orm_1.eq)(schema.videos.id, getVideoPresignedPutURLDto.id))
			.execute();
		return {
			url,
			fileRecord,
		};
	}
	async getVideoById(id) {
		return this.drizzleService.db.query.videos.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.videos.id, id),
			with: {
				videosToTags: {
					with: {
						tag: true,
					},
				},
				subtitles: true,
				videoFile: true,
				thumbnailFile: true,
				comments: {
					with: {
						owner: {
							with: {
								avatar: true,
							},
						},
					},
				},
				channel: {
					with: {
						avatar: true,
					},
				},
			},
		});
	}
	async deleteVideo(deleteVideoDto, user) {
		await this.userOwnsVideo(deleteVideoDto.id, user);
		await this.drizzleService.db
			.update(schema.videos)
			.set({ isActive: false, deletedAt: new Date() })
			.where((0, drizzle_orm_1.eq)(schema.videos.id, deleteVideoDto.id));
		await this.videoSearchService.deleteIndexVideo(deleteVideoDto.id);
		return {
			message: 'Video Deleted Successfully',
		};
	}
	async updateIndexVideo(videoId, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		const video = await manager.query.videos.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.videos.id, videoId),
		});
		await this.videoSearchService.indexVideo({
			id: video.id,
			name: video.name,
			description: video.description,
		});
	}
});
exports.VideoService = VideoService;
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [get_videos_1.GetVideosDto, Object]),
		__metadata('design:returntype', Promise),
	],
	VideoService.prototype,
	'getAllVideosOfMyChannel',
	null,
);
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [get_videos_1.GetVideosDto, Object]),
		__metadata('design:returntype', Promise),
	],
	VideoService.prototype,
	'getAllVideos',
	null,
);
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteVideoDto, Object]),
		__metadata('design:returntype', Promise),
	],
	VideoService.prototype,
	'deleteVideo',
	null,
);
exports.VideoService =
	VideoService =
	VideoService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => tags_service_1.TagService))),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					file_service_1.FileService,
					channel_service_1.ChannelService,
					producer_service_1.ProducerService,
					consumer_service_1.ConsumerService,
					tags_service_1.TagService,
					playlist_service_1.PlaylistService,
					video_search_service_1.default,
					minio_client_service_1.MinioClientService,
				]),
			],
			VideoService,
		);
//# sourceMappingURL=video.service.js.map
