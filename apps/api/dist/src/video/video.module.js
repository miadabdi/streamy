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
exports.VideoModule = void 0;
const common_1 = require('@nestjs/common');
const channel_module_1 = require('../channel/channel.module');
const drizzle_module_1 = require('../drizzle/drizzle.module');
const file_module_1 = require('../file/file.module');
const minio_client_module_1 = require('../minio-client/minio-client.module');
const playlist_module_1 = require('../playlist/playlist.module');
const queue_module_1 = require('../queue/queue.module');
const search_module_1 = require('../search/search.module');
const tags_module_1 = require('../tag/tags.module');
const video_controller_1 = require('./video.controller');
const video_service_1 = require('./video.service');
let VideoModule = class VideoModule {};
exports.VideoModule = VideoModule;
exports.VideoModule = VideoModule = __decorate(
	[
		(0, common_1.Module)({
			imports: [
				drizzle_module_1.DrizzleModule,
				file_module_1.FileModule,
				channel_module_1.ChannelModule,
				queue_module_1.QueueModule,
				tags_module_1.TagModule,
				playlist_module_1.PlaylistModule,
				search_module_1.SearchModule,
				minio_client_module_1.MinioClientModule,
			],
			controllers: [video_controller_1.VideoController],
			providers: [video_service_1.VideoService],
			exports: [video_service_1.VideoService],
		}),
	],
	VideoModule,
);
//# sourceMappingURL=video.module.js.map
