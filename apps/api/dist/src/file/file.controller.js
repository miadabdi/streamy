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
exports.FileController = void 0;
const common_1 = require('@nestjs/common');
const platform_express_1 = require('@nestjs/platform-express');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const sharp_pipe_pipe_1 = require('../common/pipes/sharp-pipe.pipe');
const dto_1 = require('./dto');
const get_presigned_put_url_dto_1 = require('./dto/get-presigned-put-url.dto');
const file_service_1 = require('./file.service');
let FileController = class FileController {
	constructor(fileService) {
		this.fileService = fileService;
	}
	async uploadImage(image, user) {
		return this.fileService.uploadImage(image, user);
	}
	async getPresignedPutURL(getPresignedPutURLDto, user) {
		return this.fileService.getPresignedPutURL(getPresignedPutURLDto, user);
	}
	async getPresignedGetURL(getPresignedGetURLDto, user) {
		return this.fileService.getPresignedGetURL(getPresignedGetURLDto, user);
	}
};
exports.FileController = FileController;
__decorate(
	[
		(0, common_1.Post)('/upload-image'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		(0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
		__param(
			0,
			(0, common_1.UploadedFile)(new sharp_pipe_pipe_1.SharpPipe({ height: 1080, width: 1920 })),
		),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [Object, Object]),
		__metadata('design:returntype', Promise),
	],
	FileController.prototype,
	'uploadImage',
	null,
);
__decorate(
	[
		(0, common_1.Get)('/get-presigned-put-url'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [get_presigned_put_url_dto_1.GetPresignedPutURLDto, Object]),
		__metadata('design:returntype', Promise),
	],
	FileController.prototype,
	'getPresignedPutURL',
	null,
);
__decorate(
	[
		(0, common_1.Get)('/get-presigned-get-url'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetPresignedGetURLDto, Object]),
		__metadata('design:returntype', Promise),
	],
	FileController.prototype,
	'getPresignedGetURL',
	null,
);
exports.FileController = FileController = __decorate(
	[(0, common_1.Controller)('file'), __metadata('design:paramtypes', [file_service_1.FileService])],
	FileController,
);
//# sourceMappingURL=file.controller.js.map
