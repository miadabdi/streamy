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
exports.PlaylistModule = void 0;
const common_1 = require('@nestjs/common');
const channel_module_1 = require('../channel/channel.module');
const drizzle_module_1 = require('../drizzle/drizzle.module');
const playlist_controller_1 = require('./playlist.controller');
const playlist_service_1 = require('./playlist.service');
let PlaylistModule = class PlaylistModule {};
exports.PlaylistModule = PlaylistModule;
exports.PlaylistModule = PlaylistModule = __decorate(
	[
		(0, common_1.Module)({
			imports: [
				drizzle_module_1.DrizzleModule,
				(0, common_1.forwardRef)(() => channel_module_1.ChannelModule),
			],
			controllers: [playlist_controller_1.PlaylistController],
			providers: [playlist_service_1.PlaylistService],
			exports: [playlist_service_1.PlaylistService],
		}),
	],
	PlaylistModule,
);
//# sourceMappingURL=playlist.module.js.map
