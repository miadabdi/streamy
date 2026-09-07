'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeleteSubtitleDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_subtitle_dto_1 = require('./update-subtitle.dto');
class DeleteSubtitleDto extends (0, swagger_1.PickType)(update_subtitle_dto_1.UpdateSubtitleDto, [
	'id',
]) {}
exports.DeleteSubtitleDto = DeleteSubtitleDto;
//# sourceMappingURL=delete-subtitle.dto.js.map
