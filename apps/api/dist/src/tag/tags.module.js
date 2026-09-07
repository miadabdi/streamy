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
Object.defineProperty(exports, '__esModule', { value: true });
exports.TagModule = void 0;
const common_1 = require('@nestjs/common');
const channel_module_1 = require('../channel/channel.module');
const drizzle_module_1 = require('../drizzle/drizzle.module');
const file_module_1 = require('../file/file.module');
const video_module_1 = require('../video/video.module');
const tags_controller_1 = require('./tags.controller');
const tags_service_1 = require('./tags.service');
let TagModule = class TagModule {};
exports.TagModule = TagModule;
exports.TagModule = TagModule = __decorate(
	[
		(0, common_1.Module)({
			imports: [
				drizzle_module_1.DrizzleModule,
				file_module_1.FileModule,
				channel_module_1.ChannelModule,
				(0, common_1.forwardRef)(() => video_module_1.VideoModule),
			],
			controllers: [tags_controller_1.TagController],
			providers: [tags_service_1.TagService],
			exports: [tags_service_1.TagService],
		}),
	],
	TagModule,
);
//# sourceMappingURL=tags.module.js.map
