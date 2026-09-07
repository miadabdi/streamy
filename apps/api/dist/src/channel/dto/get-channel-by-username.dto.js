'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.GetChannelByUsernameDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const create_channel_dto_1 = require('./create-channel.dto');
class GetChannelByUsernameDto extends (0, swagger_1.PickType)(
	create_channel_dto_1.CreateChannelDto,
	['username'],
) {}
exports.GetChannelByUsernameDto = GetChannelByUsernameDto;
//# sourceMappingURL=get-channel-by-username.dto.js.map
