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
exports.ChannelModule = void 0;
const common_1 = require('@nestjs/common');
const drizzle_module_1 = require('../drizzle/drizzle.module');
const file_module_1 = require('../file/file.module');
const playlist_module_1 = require('../playlist/playlist.module');
const channel_controller_1 = require('./channel.controller');
const channel_service_1 = require('./channel.service');
let ChannelModule = class ChannelModule {};
exports.ChannelModule = ChannelModule;
exports.ChannelModule = ChannelModule = __decorate(
	[
		(0, common_1.Module)({
			imports: [
				drizzle_module_1.DrizzleModule,
				file_module_1.FileModule,
				(0, common_1.forwardRef)(() => playlist_module_1.PlaylistModule),
			],
			controllers: [channel_controller_1.ChannelController],
			providers: [channel_service_1.ChannelService],
			exports: [channel_service_1.ChannelService],
		}),
	],
	ChannelModule,
);
//# sourceMappingURL=channel.module.js.map
