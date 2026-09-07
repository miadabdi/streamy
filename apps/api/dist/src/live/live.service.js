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
var LiveService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.LiveService = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const drizzle_orm_1 = require('drizzle-orm');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const schema_1 = require('../drizzle/schema');
const producer_service_1 = require('../queue/producer.service');
const video_service_1 = require('../video/video.service');
let LiveService = (LiveService_1 = class LiveService {
	constructor(configService, videoService, drizzleService, producerService) {
		this.configService = configService;
		this.videoService = videoService;
		this.drizzleService = drizzleService;
		this.producerService = producerService;
		this.logger = new common_1.Logger(LiveService_1.name);
	}
	async sendLiveProcessRMQMsg(payload) {
		await this.producerService.addToQueue('q.live.process', payload);
	}
	async sendLiveToProcessQueue(app, streamKey) {
		const video = await this.drizzleService.db.query.videos.findFirst({
			where: (0, drizzle_orm_1.and)(
				(0, drizzle_orm_1.eq)(schema.videos.type, schema_1.videoTypeEnum.live),
				(0, drizzle_orm_1.eq)(schema.videos.videoId, streamKey),
			),
		});
		if (!video) {
			throw new common_1.NotFoundException(`Live video with stream key ${streamKey} not found`);
		}
		if (video.processingStatus != schema.VideoProccessingStatusEnum.ready_for_processing) {
			throw new common_1.BadRequestException(
				`Video is not in ready_for_processing state, current state: ${video.processingStatus}`,
			);
		}
		await this.sendLiveProcessRMQMsg({
			id: video.id,
			videoId: video.videoId,
			app,
			streamKey,
		});
		await this.drizzleService.db
			.update(schema.videos)
			.set({
				processingStatus: schema.VideoProccessingStatusEnum.processing,
			})
			.where((0, drizzle_orm_1.eq)(schema.videos.id, video.id))
			.execute();
		return {
			message: 'Live sent to process queue successfully',
		};
	}
	async srsOnPublish(srsOnPublishDto) {
		if (srsOnPublishDto.app != 'live') {
			throw new common_1.ForbiddenException('Only live app is allowed');
		}
		const data = await this.videoService.getLiveByVideoId(srsOnPublishDto.stream);
		if (!data) {
			throw new common_1.NotFoundException('Key not found');
		}
		await this.sendLiveToProcessQueue(srsOnPublishDto.app, srsOnPublishDto.stream);
		return { code: 0 };
	}
	async srsOnUnpublish(srsOnUnpublishDto) {
		if (srsOnUnpublishDto.app != 'live') {
			throw new common_1.ForbiddenException('Only live app is allowed');
		}
		const video = await this.videoService.getLiveByVideoId(srsOnUnpublishDto.stream);
		if (!video) {
			throw new common_1.NotFoundException('Key not found');
		}
		await this.drizzleService.db
			.update(schema.videos)
			.set({ isActive: false })
			.where((0, drizzle_orm_1.eq)(schema.videos.id, video.id))
			.execute();
		return { code: 0 };
	}
	srsOnPlay(srsOnPlayDto) {
		console.dir(srsOnPlayDto, { depth: null });
		return { code: 0 };
	}
	srsOnStop(srsOnStopDto) {
		console.dir(srsOnStopDto, { depth: null });
		return { code: 0 };
	}
});
exports.LiveService = LiveService;
exports.LiveService =
	LiveService =
	LiveService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					config_1.ConfigService,
					video_service_1.VideoService,
					drizzle_service_1.DrizzleService,
					producer_service_1.ProducerService,
				]),
			],
			LiveService,
		);
//# sourceMappingURL=live.service.js.map
