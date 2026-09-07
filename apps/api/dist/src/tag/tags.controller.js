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
exports.TagController = void 0;
const common_1 = require('@nestjs/common');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const dto_1 = require('./dto');
const tags_service_1 = require('./tags.service');
let TagController = class TagController {
	constructor(tagService) {
		this.tagService = tagService;
	}
	createTag(createTagDto, user) {
		return this.tagService.createTag(createTagDto, user);
	}
	addTagsToVideo(addTagsToVideoDto, user) {
		return this.tagService.addTagsToVideo(addTagsToVideoDto, user);
	}
	getTagById(getTagByIdDto, user) {
		return this.tagService.getTagById(getTagByIdDto.id);
	}
	getTags(user) {
		return this.tagService.getTags();
	}
	deleteTag(deleteTagDto, user) {
		return this.tagService.deleteTag(deleteTagDto, user);
	}
};
exports.TagController = TagController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)(),
		(0, common_1.UseGuards)(guards_1.AdminGuard),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.CreateTagDto, Object]),
		__metadata('design:returntype', void 0),
	],
	TagController.prototype,
	'createTag',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/add-tags-to-video'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.AddTagsToVideoDto, Object]),
		__metadata('design:returntype', void 0),
	],
	TagController.prototype,
	'addTagsToVideo',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetTagByIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	TagController.prototype,
	'getTagById',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)(),
		__param(0, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [Object]),
		__metadata('design:returntype', void 0),
	],
	TagController.prototype,
	'getTags',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Delete)(),
		(0, common_1.UseGuards)(guards_1.AdminGuard),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteTagDto, Object]),
		__metadata('design:returntype', void 0),
	],
	TagController.prototype,
	'deleteTag',
	null,
);
exports.TagController = TagController = __decorate(
	[
		(0, common_1.Controller)('/tag'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [tags_service_1.TagService]),
	],
	TagController,
);
//# sourceMappingURL=tags.controller.js.map
