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
exports.PlaylistController = void 0;
const common_1 = require('@nestjs/common');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const dto_1 = require('./dto');
const playlist_service_1 = require('./playlist.service');
let PlaylistController = class PlaylistController {
	constructor(playlistService) {
		this.playlistService = playlistService;
	}
	createPlaylist(createPlaylistDto, user) {
		return this.playlistService.createPlaylist(createPlaylistDto, user);
	}
	addVideos(addVideosDto, user) {
		return this.playlistService.addVideos(addVideosDto, user);
	}
	updatePlaylist(updatePlaylistDto, user) {
		return this.playlistService.updatePlaylist(updatePlaylistDto, user);
	}
	getPlaylistById(getPlaylistByIdDto, user) {
		return this.playlistService.getPlaylistById(getPlaylistByIdDto.id);
	}
	deletePlaylist(deletePlaylistDto, user) {
		return this.playlistService.deletePlaylist(deletePlaylistDto, user);
	}
};
exports.PlaylistController = PlaylistController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.CreatePlaylistDto, Object]),
		__metadata('design:returntype', void 0),
	],
	PlaylistController.prototype,
	'createPlaylist',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/add-videos'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.AddVideosDto, Object]),
		__metadata('design:returntype', void 0),
	],
	PlaylistController.prototype,
	'addVideos',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.UpdatePlaylistDto, Object]),
		__metadata('design:returntype', void 0),
	],
	PlaylistController.prototype,
	'updatePlaylist',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetPlaylistByIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	PlaylistController.prototype,
	'getPlaylistById',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Delete)(),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeletePlaylistDto, Object]),
		__metadata('design:returntype', void 0),
	],
	PlaylistController.prototype,
	'deletePlaylist',
	null,
);
exports.PlaylistController = PlaylistController = __decorate(
	[
		(0, common_1.Controller)('/playlist'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [playlist_service_1.PlaylistService]),
	],
	PlaylistController,
);
//# sourceMappingURL=playlist.controller.js.map
