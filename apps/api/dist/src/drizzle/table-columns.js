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
Object.defineProperty(exports, '__esModule', { value: true });
exports.commentsTableColumns =
	exports.subscriptionsTableColumns =
	exports.tagsVideosTableColumns =
	exports.tagsTableColumns =
	exports.playlistsVideosTableColumns =
	exports.playlistsTableColumns =
	exports.subtitlesTableColumns =
	exports.videosTableColumns =
	exports.channelsTableColumns =
	exports.filesTableColumns =
	exports.usersTableColumns =
		void 0;
const drizzle_orm_1 = require('drizzle-orm');
const schema = __importStar(require('./schema'));
exports.usersTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.users);
exports.filesTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.files);
exports.channelsTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.channels);
exports.videosTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.videos);
exports.subtitlesTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.subtitles);
exports.playlistsTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.playlists);
exports.playlistsVideosTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.playlistsVideos);
exports.tagsTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.tags);
exports.tagsVideosTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.tagsVideos);
exports.subscriptionsTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.subscriptions);
exports.commentsTableColumns = (0, drizzle_orm_1.getTableColumns)(schema.comments);
//# sourceMappingURL=table-columns.js.map
