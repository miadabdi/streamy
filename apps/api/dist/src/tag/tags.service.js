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
var TagService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.TagService = void 0;
const common_1 = require('@nestjs/common');
const drizzle_orm_1 = require('drizzle-orm');
const decorators_1 = require('../common/decorators');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const video_service_1 = require('../video/video.service');
const dto_1 = require('./dto');
let TagService = (TagService_1 = class TagService {
	constructor(drizzleService, videoService) {
		this.drizzleService = drizzleService;
		this.videoService = videoService;
		this.logger = new common_1.Logger(TagService_1.name);
	}
	async createTag(createTagDto, user) {
		const dupTag = await this.drizzleService.db.query.tags.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.tags.title, createTagDto.title),
		});
		if (dupTag) {
			throw new common_1.ConflictException('Tag already exists');
		}
		const { ...returningKeys } = table_columns_1.tagsTableColumns;
		const tags = await this.drizzleService.db
			.insert(schema.tags)
			.values({
				...createTagDto,
			})
			.returning(returningKeys)
			.execute();
		return tags[0];
	}
	async addTagsToVideo(addTagsToVideoDto, user, tx) {
		const manager = tx ? tx : this.drizzleService.db;
		await this.videoService.userOwnsVideo(addTagsToVideoDto.videoId, user, tx);
		const tagIdsUnique = [...new Set(addTagsToVideoDto.tagIds)];
		const tags = await manager.query.tags.findMany({
			where: (0, drizzle_orm_1.and)(
				(0, drizzle_orm_1.inArray)(schema.tags.id, tagIdsUnique),
				(0, drizzle_orm_1.eq)(schema.tags.isActive, true),
			),
		});
		for (const tagId of tagIdsUnique) {
			const tag = tags.find((tag) => tag.id == tagId);
			if (!tag) {
				throw new common_1.NotFoundException(`Tag with id ${tagId} not found`);
			}
		}
		const values = addTagsToVideoDto.tagIds.map((tagId) => {
			return {
				tagId,
				videoId: addTagsToVideoDto.videoId,
			};
		});
		await manager.insert(schema.tagsVideos).values(values).onConflictDoNothing().execute();
		return {
			message: 'Tags were added to the video',
		};
	}
	async getTagById(id) {
		return this.drizzleService.db.query.tags.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.tags.id, id),
		});
	}
	async deleteTag(deleteTagDto, user) {
		await this.drizzleService.db
			.update(schema.tags)
			.set({ isActive: false, deletedAt: new Date() })
			.where((0, drizzle_orm_1.eq)(schema.tags.id, deleteTagDto.id));
		return {
			message: 'Tag Deleted Successfully',
		};
	}
	getTags() {
		return this.drizzleService.db.query.tags.findMany({
			where: (0, drizzle_orm_1.eq)(schema.tags.isActive, true),
		});
	}
});
exports.TagService = TagService;
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteTagDto, Object]),
		__metadata('design:returntype', Promise),
	],
	TagService.prototype,
	'deleteTag',
	null,
);
exports.TagService =
	TagService =
	TagService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__param(
					1,
					(0, common_1.Inject)((0, common_1.forwardRef)(() => video_service_1.VideoService)),
				),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					video_service_1.VideoService,
				]),
			],
			TagService,
		);
//# sourceMappingURL=tags.service.js.map
