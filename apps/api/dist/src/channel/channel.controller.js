'use strict';
var __decorate =
	(this && this.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
			r = Reflect.decorate(decorators, target, key, desc);
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return (c > 3 && r && Object.defineProperty(target, key, r), r);
	};
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
var __param =
	(this && this.__param) ||
	function (paramIndex, decorator) {
		return function (target, key) {
			decorator(target, key, paramIndex);
		};
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.ChannelController = void 0;
const common_1 = require('@nestjs/common');
const platform_express_1 = require('@nestjs/platform-express');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const sharp_pipe_pipe_1 = require('../common/pipes/sharp-pipe.pipe');
const channel_service_1 = require('./channel.service');
const dto_1 = require('./dto');
const delete_subscription_dto_1 = require('./dto/delete-subscription.dto');
let ChannelController = class ChannelController {
	constructor(channelService) {
		this.channelService = channelService;
	}
	createChannel(createChannelDto, user) {
		return this.channelService.createChannel(createChannelDto, user);
	}
	addSubscription(addSubscriptionDto, user) {
		return this.channelService.addSubscription(addSubscriptionDto, user);
	}
	deleteSubscription(deleteSubscriptionDto, user) {
		return this.channelService.deleteSubscription(deleteSubscriptionDto, user);
	}
	updateChannel(updateChannelDto, user, avatar) {
		return this.channelService.updateChannel(updateChannelDto, user, avatar);
	}
	getChannelById(getChannelByIdDto, user) {
		return this.channelService.getChannelById(getChannelByIdDto.id);
	}
	getChannelByUsername(getChannelByUsernameDto, user) {
		return this.channelService.getChannelByUsername(getChannelByUsernameDto.username);
	}
	deleteChannel(deleteChannelDto, user) {
		return this.channelService.deleteChannel(deleteChannelDto, user);
	}
};
exports.ChannelController = ChannelController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)(),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.CreateChannelDto, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'createChannel',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/add-subscription'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.AddSubscriptionDto, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'addSubscription',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/delete-subscription'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [delete_subscription_dto_1.DeleteSubscriptionDto, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'deleteSubscription',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)(),
		(0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__param(
			2,
			(0, common_1.UploadedFile)(new sharp_pipe_pipe_1.SharpPipe({ width: 400, height: 400 })),
		),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.UpdateChannelDto, Object, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'updateChannel',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-id'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetChannelByIdDto, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'getChannelById',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/by-username'),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.GetChannelByUsernameDto, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'getChannelByUsername',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Delete)(),
		__param(0, (0, common_1.Query)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.DeleteChannelDto, Object]),
		__metadata('design:returntype', void 0),
	],
	ChannelController.prototype,
	'deleteChannel',
	null,
);
exports.ChannelController = ChannelController = __decorate(
	[
		(0, common_1.Controller)('/channel'),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [channel_service_1.ChannelService]),
	],
	ChannelController,
);
//# sourceMappingURL=channel.controller.js.map
