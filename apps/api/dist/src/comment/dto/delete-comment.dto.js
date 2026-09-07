'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeleteCommentDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_comment_dto_1 = require('./update-comment.dto');
class DeleteCommentDto extends (0, swagger_1.PickType)(update_comment_dto_1.UpdateCommentDto, [
	'id',
]) {}
exports.DeleteCommentDto = DeleteCommentDto;
//# sourceMappingURL=delete-comment.dto.js.map
