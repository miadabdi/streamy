'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GetCommentByIdDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_comment_dto_1 = require('./update-comment.dto');
class GetCommentByIdDto extends (0, swagger_1.PickType)(update_comment_dto_1.UpdateCommentDto, [
	'id',
]) {}
exports.GetCommentByIdDto = GetCommentByIdDto;
//# sourceMappingURL=get-comment-by-id.dto.js.map
