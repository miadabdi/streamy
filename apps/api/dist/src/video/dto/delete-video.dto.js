'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeleteVideoDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_video_dto_1 = require('./update-video.dto');
class DeleteVideoDto extends (0, swagger_1.PickType)(update_video_dto_1.UpdateVideoDto, ['id']) {}
exports.DeleteVideoDto = DeleteVideoDto;
//# sourceMappingURL=delete-video.dto.js.map
