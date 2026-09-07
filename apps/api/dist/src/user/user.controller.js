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
exports.UserController = void 0;
const common_1 = require('@nestjs/common');
const throttler_1 = require('@nestjs/throttler');
const decorators_1 = require('../common/decorators');
const guards_1 = require('../common/guards');
const dto_1 = require('./dto');
const user_service_1 = require('./user.service');
let UserController = class UserController {
	constructor(userService) {
		this.userService = userService;
	}
	getMe(user) {
		return this.userService.getMe(user);
	}
	updateUser(updateUserDto, user) {
		return this.userService.updateUser(updateUserDto, user);
	}
	promoteUser(promoteUserDto, user) {
		return this.userService.promoteUser(promoteUserDto.email);
	}
	async setCurrentChannel(setCurrentChannelDto, user) {
		return this.userService.setCurrentChannel(setCurrentChannelDto, user);
	}
};
exports.UserController = UserController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Get)('/me'),
		__param(0, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [Object]),
		__metadata('design:returntype', void 0),
	],
	UserController.prototype,
	'getMe',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)('/update-me'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.UpdateUserDto, Object]),
		__metadata('design:returntype', void 0),
	],
	UserController.prototype,
	'updateUser',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)('/promote'),
		(0, common_1.UseGuards)(guards_1.AdminGuard),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.PromoteUserDto, Object]),
		__metadata('design:returntype', void 0),
	],
	UserController.prototype,
	'promoteUser',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Patch)('/set-current-channel'),
		__param(0, (0, common_1.Body)()),
		__param(1, (0, decorators_1.GetUser)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.SetCurrentChannelDto, Object]),
		__metadata('design:returntype', Promise),
	],
	UserController.prototype,
	'setCurrentChannel',
	null,
);
exports.UserController = UserController = __decorate(
	[
		(0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
		(0, throttler_1.Throttle)({ default: { limit: 120, ttl: 60 * 10 } }),
		(0, common_1.Controller)({ path: 'user', version: '1' }),
		(0, common_1.UseGuards)(guards_1.JwtAuthGuard),
		__metadata('design:paramtypes', [user_service_1.UserService]),
	],
	UserController,
);
//# sourceMappingURL=user.controller.js.map
