'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GetSubtitleByIdDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_subtitle_dto_1 = require('./update-subtitle.dto');
class GetSubtitleByIdDto extends (0, swagger_1.PickType)(update_subtitle_dto_1.UpdateSubtitleDto, [
	'id',
]) {}
exports.GetSubtitleByIdDto = GetSubtitleByIdDto;
//# sourceMappingURL=get-subtitle-by-id.dto.js.map
