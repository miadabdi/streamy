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
var SubtitleService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.SubtitleService = void 0;
const common_1 = require('@nestjs/common');
const drizzle_orm_1 = require('drizzle-orm');
const constants_1 = require('../common/constants');
const decorators_1 = require('../common/decorators');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const file_service_1 = require('../file/file.service');
const video_service_1 = require('../video/video.service');
const dto_1 = require('./dto');
let SubtitleService = (SubtitleService_1 = class SubtitleService {
	constructor(drizzleService, fileService, videoService) {
		this.drizzleService = drizzleService;
		this.fileService = fileService;
		this.videoService = videoService;
		this.logger = new common_1.Logger(SubtitleService_1.name);
	}
	async userOwnsSubtitle(id, user) {
		const subtitle = await this.drizzleService.db.query.subtitles.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.subtitles.id, id),
			with: {
				video: {
					with: {
						channel: true,
					},
				},
			},
		});
		if (!subtitle) {
			throw new common_1.NotFoundException(`Subtitle with id ${id} not found`);
		}
		if (subtitle.video.channel.ownerId !== user.id) {
			throw new common_1.ForbiddenException(`You don't own subtitle with id ${id}`);
		}
	}
	async createSubtitle(createSubtitleDto, file, user) {
		await this.videoService.userOwnsVideo(createSubtitleDto.videoId, user);
		const fileRecord = await this.fileService.uploadAndCreateFileRecord(
			file,
			'',
			'subtitlefiles',
			user,
		);
		const { ...returningKeys } = table_columns_1.subtitlesTableColumns;
		const subtitle = await this.drizzleService.db
			.insert(schema.subtitles)
			.values({
				videoId: createSubtitleDto.videoId,
				langRFC5646: createSubtitleDto.langRFC5646,
				fileId: fileRecord.id,
			})
			.returning(returningKeys)
			.execute();
		return subtitle[0];
	}
	async updateSubtitle(updateSubtitleDto, user) {
		await this.userOwnsSubtitle(updateSubtitleDto.id, user);
		const { ...returningKeys } = table_columns_1.subtitlesTableColumns;
		const updatedSubtitle = await this.drizzleService.db
			.update(schema.subtitles)
			.set({
				...updateSubtitleDto,
			})
			.where((0, drizzle_orm_1.eq)(schema.subtitles.id, updateSubtitleDto.id))
			.returning(returningKeys)
			.execute();
		return updatedSubtitle[0];
	}
	async getSubtitlesByVideoId(videoId) {
		return this.drizzleService.db.query.subtitles.findMany({
			where: (0, drizzle_orm_1.eq)(schema.subtitles.videoId, videoId),
			with: {
				video: true,
			},
		});
	}
	getLanguageOfRFC5646(identifier) {
		return {
			language: constants_1.RFC5646_LANGUAGE_TAGS[identifier],
		};
	}
	async getSubtitleById(id) {
		const subtitle = await this.drizzleService.db.query.subtitles.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.subtitles.id, id),
			with: {
				video: true,
			},
		});
		return subtitle;
	}
	async deleteSubtitle(deleteSubtitleDto, user) {
		await this.userOwnsSubtitle(deleteSubtitleDto.id, user);
		await this.drizzleService.db
			.update(schema.subtitles)
			.set({ isActive: false, deletedAt: new Date() })
			.where((0, drizzle_orm_1.eq)(schema.subtitles.id, deleteSubtitleDto.id));
		return {
			message: 'Subtitle Deleted Successfully',
		};
	}
});
exports.SubtitleService = SubtitleService;
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteSubtitleDto, Object]),
		__metadata('design:returntype', Promise),
	],
	SubtitleService.prototype,
	'deleteSubtitle',
	null,
);
exports.SubtitleService =
	SubtitleService =
	SubtitleService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					file_service_1.FileService,
					video_service_1.VideoService,
				]),
			],
			SubtitleService,
		);
//# sourceMappingURL=subtitle.service.js.map
