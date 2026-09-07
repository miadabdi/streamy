'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GetChannelByIdDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const update_channel_dto_1 = require('./update-channel.dto');
class GetChannelByIdDto extends (0, swagger_1.PickType)(update_channel_dto_1.UpdateChannelDto, [
	'id',
]) {}
exports.GetChannelByIdDto = GetChannelByIdDto;
//# sourceMappingURL=get-channel-by-id.dto.js.map
