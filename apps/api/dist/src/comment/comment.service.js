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
var CommentService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.CommentService = void 0;
const common_1 = require('@nestjs/common');
const drizzle_orm_1 = require('drizzle-orm');
const decorators_1 = require('../common/decorators');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const video_service_1 = require('../video/video.service');
const dto_1 = require('./dto');
let CommentService = (CommentService_1 = class CommentService {
	constructor(drizzleService, videoService) {
		this.drizzleService = drizzleService;
		this.videoService = videoService;
		this.logger = new common_1.Logger(CommentService_1.name);
	}
	async userOwnsComment(id, user) {
		const comment = await this.drizzleService.db.query.comments.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.comments.id, id),
			with: {
				owner: true,
			},
		});
		if (!comment) {
			throw new common_1.NotFoundException(`Comment with id ${id} not found`);
		}
		if (comment.owner.ownerId !== user.id) {
			throw new common_1.ForbiddenException(`You don't own comment with id ${id}`);
		}
	}
	async createComment(createCommentDto, user) {
		const channel = await this.drizzleService.db.query.channels.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.channels.id, createCommentDto.ownerId),
		});
		if (!channel) {
			throw new common_1.NotFoundException(`Channel with id ${createCommentDto.ownerId} not found`);
		}
		if (channel.ownerId !== user.id) {
			throw new common_1.ForbiddenException(
				`You don't own channel with id ${createCommentDto.ownerId}`,
			);
		}
		const video = await this.videoService.getVideoById(createCommentDto.videoId);
		if (!video) {
			throw new common_1.NotFoundException(`Video with id ${createCommentDto.videoId} not found`);
		}
		if (createCommentDto.replyTo) {
			const repliedTo = await this.drizzleService.db.query.comments.findFirst({
				where: (0, drizzle_orm_1.eq)(schema.comments.id, createCommentDto.replyTo),
			});
			if (!repliedTo) {
				throw new common_1.NotFoundException(
					`Replied to non-existent comment with id ${createCommentDto.replyTo}`,
				);
			}
		}
		const { ...returningKeys } = table_columns_1.commentsTableColumns;
		const comments = await this.drizzleService.db
			.insert(schema.comments)
			.values({
				...createCommentDto,
			})
			.returning(returningKeys)
			.execute();
		return comments[0];
	}
	async updateComment(updateCommentDto, user) {
		await this.userOwnsComment(updateCommentDto.id, user);
		const { ...returningKeys } = table_columns_1.commentsTableColumns;
		const updatedComment = await this.drizzleService.db
			.update(schema.comments)
			.set({
				...updateCommentDto,
			})
			.where((0, drizzle_orm_1.eq)(schema.comments.id, updateCommentDto.id))
			.returning(returningKeys)
			.execute();
		return updatedComment[0];
	}
	async getCommentById(id) {
		return this.drizzleService.db.query.comments.findFirst({
			where: (0, drizzle_orm_1.eq)(schema.comments.id, id),
			with: {
				repliedTo: true,
				replies: {
					where: (0, drizzle_orm_1.eq)(schema.comments.isActive, true),
				},
			},
		});
	}
	async deleteComment(deleteCommentDto, user) {
		await this.userOwnsComment(deleteCommentDto.id, user);
		await this.drizzleService.db
			.update(schema.comments)
			.set({ isActive: false, deletedAt: new Date() })
			.where((0, drizzle_orm_1.eq)(schema.comments.id, deleteCommentDto.id));
		return {
			message: 'Comment Deleted Successfully',
		};
	}
});
exports.CommentService = CommentService;
__decorate(
	[
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteCommentDto, Object]),
		__metadata('design:returntype', Promise),
	],
	CommentService.prototype,
	'deleteComment',
	null,
);
exports.CommentService =
	CommentService =
	CommentService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					drizzle_service_1.DrizzleService,
					video_service_1.VideoService,
				]),
			],
			CommentService,
		);
//# sourceMappingURL=comment.service.js.map
