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
exports.CommentController = void 0;
const common_1 = require('@nestjs/common');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const comment_service_1 = require('./comment.service');
const dto_1 = require('./dto');
let CommentController = class CommentController {
	constructor(commentService) {
		this.commentService = commentService;
	}
	createComment(createCommentDto, user) {
		return this.commentService.createComment(createCommentDto, user);
	}
	updateComment(updateCommentDto, user) {
		return this.commentService.updateComment(updateCommentDto, user);
	}
	getCommentById(getCommentByIdDto, user) {
		return this.commentService.getCommentById(getCommentByIdDto.id);
	}
	deleteComment(deleteCommentDto, user) {
		return this.commentService.deleteComment(deleteCommentDto, user);
	}
};
exports.CommentController = CommentController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.CreateCommentDto, Object]),
		__metadata('design:returntype', void 0),
	],
	CommentController.prototype,
	'createComment',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.UpdateCommentDto, Object]),
		__metadata('design:returntype', void 0),
	],
	CommentController.prototype,
	'updateComment',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetCommentByIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	CommentController.prototype,
	'getCommentById',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Delete)(),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteCommentDto, Object]),
		__metadata('design:returntype', void 0),
	],
	CommentController.prototype,
	'deleteComment',
	null,
);
exports.CommentController = CommentController = __decorate(
	[
		(0, common_1.Controller)('/comment'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [comment_service_1.CommentService]),
	],
	CommentController,
);
//# sourceMappingURL=comment.controller.js.map
