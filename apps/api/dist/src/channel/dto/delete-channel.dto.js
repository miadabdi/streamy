'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeleteChannelDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_channel_dto_1 = require('./update-channel.dto');
class DeleteChannelDto extends (0, swagger_1.PickType)(update_channel_dto_1.UpdateChannelDto, [
	'id',
]) {}
exports.DeleteChannelDto = DeleteChannelDto;
//# sourceMappingURL=delete-channel.dto.js.map
