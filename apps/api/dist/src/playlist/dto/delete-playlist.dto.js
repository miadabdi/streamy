'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeletePlaylistDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_playlist_dto_1 = require('./update-playlist.dto');
class DeletePlaylistDto extends (0, swagger_1.PickType)(update_playlist_dto_1.UpdatePlaylistDto, [
	'id',
]) {}
exports.DeletePlaylistDto = DeletePlaylistDto;
//# sourceMappingURL=delete-playlist.dto.js.map
