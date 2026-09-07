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
exports.SubtitleController = void 0;
const common_1 = require('@nestjs/common');
const platform_express_1 = require('@nestjs/platform-express');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const dto_1 = require('./dto');
const subtitle_service_1 = require('./subtitle.service');
let SubtitleController = class SubtitleController {
	constructor(subtitleService) {
		this.subtitleService = subtitleService;
	}
	createSubtitle(createSubtitleDto, file, user) {
		return this.subtitleService.createSubtitle(createSubtitleDto, file, user);
	}
	updateSubtitle(updateSubtitleDto, user) {
		return this.subtitleService.updateSubtitle(updateSubtitleDto, user);
	}
	getSubtitleById(getSubtitleByIdDto, user) {
		return this.subtitleService.getSubtitleById(getSubtitleByIdDto.id);
	}
	getLanguageOfRFC5646(identifier, user) {
		return this.subtitleService.getLanguageOfRFC5646(identifier);
	}
	getSubtitleByVideoId(getSubtitleByVideoIdDto, user) {
		return this.subtitleService.getSubtitlesByVideoId(getSubtitleByVideoIdDto.videoId);
	}
	deleteSubtitle(deleteSubtitleDto, user) {
		return this.subtitleService.deleteSubtitle(deleteSubtitleDto, user);
	}
};
exports.SubtitleController = SubtitleController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)(),
		(0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, common_1.UploadedFile)()),
		__param(2, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.CreateSubtitleDto, Object, Object]),
		__metadata('design:returntype', void 0),
	],
	SubtitleController.prototype,
	'createSubtitle',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.UpdateSubtitleDto, Object]),
		__metadata('design:returntype', void 0),
	],
	SubtitleController.prototype,
	'updateSubtitle',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetSubtitleByIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	SubtitleController.prototype,
	'getSubtitleById',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-language-rfc5646/:identifier'),
		__param(0, (0, common_1.Param)('identifier')),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [String, Object]),
		__metadata('design:returntype', void 0),
	],
	SubtitleController.prototype,
	'getLanguageOfRFC5646',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-video-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetSubtitleByVideoIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	SubtitleController.prototype,
	'getSubtitleByVideoId',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Delete)(),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteSubtitleDto, Object]),
		__metadata('design:returntype', void 0),
	],
	SubtitleController.prototype,
	'deleteSubtitle',
	null,
);
exports.SubtitleController = SubtitleController = __decorate(
	[
		(0, common_1.Controller)('/subtitle'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [subtitle_service_1.SubtitleService]),
	],
	SubtitleController,
);
//# sourceMappingURL=subtitle.controller.js.map
