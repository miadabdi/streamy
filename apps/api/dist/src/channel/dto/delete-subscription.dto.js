'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DeleteSubscriptionDto = void 0;
const swagger_1 = require('@nestjs/swagger');
const add_subscription_dto_1 = require('./add-subscription.dto');
class DeleteSubscriptionDto extends (0, swagger_1.OmitType)(
	add_subscription_dto_1.AddSubscriptionDto,
	[],
) {}
exports.DeleteSubscriptionDto = DeleteSubscriptionDto;
//# sourceMappingURL=delete-subscription.dto.js.map
