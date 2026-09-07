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
exports.AuthController = void 0;
const common_1 = require('@nestjs/common');
const throttler_1 = require('@nestjs/throttler');
const constants_1 = require('../common/constants');
const auth_service_1 = require('./auth.service');
const dto_1 = require('./dto');
let AuthController = class AuthController {
	constructor(authService) {
		this.authService = authService;
	}
	signUp(signUpDto) {
		return this.authService.signUp(signUpDto);
	}
	signIn(response, signInDto) {
		return this.authService.signIn(response, signInDto);
	}
	forgotPassword(forgotPasswordDto) {
		return this.authService.forgotPassword(forgotPasswordDto);
	}
	resetPassword(resetPasswordDto) {
		return this.authService.resetPassword(resetPasswordDto);
	}
	async signOut(response) {
		response.cookie(constants_1.JWT_COOKIE_NAME, '', { expires: new Date() });
	}
};
exports.AuthController = AuthController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
		(0, common_1.Post)('/signup'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.SignUpDto]),
		__metadata('design:returntype', void 0),
	],
	AuthController.prototype,
	'signUp',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/signin'),
		__param(0, (0, common_1.Res)({ passthrough: true })),
		__param(1, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [Object, dto_1.SignInDto]),
		__metadata('design:returntype', void 0),
	],
	AuthController.prototype,
	'signIn',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/forgot-password'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.ForgotPasswordDto]),
		__metadata('design:returntype', void 0),
	],
	AuthController.prototype,
	'forgotPassword',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/reset-password'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.ResetPasswordDto]),
		__metadata('design:returntype', void 0),
	],
	AuthController.prototype,
	'resetPassword',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/signout'),
		__param(0, (0, common_1.Res)({ passthrough: true })),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [Object]),
		__metadata('design:returntype', Promise),
	],
	AuthController.prototype,
	'signOut',
	null,
);
exports.AuthController = AuthController = __decorate(
	[
		(0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
		(0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60 * 10 } }),
		(0, common_1.Controller)({ path: 'auth', version: '1' }),
		__metadata('design:paramtypes', [auth_service_1.AuthService]),
	],
	AuthController,
);
//# sourceMappingURL=auth.controller.js.map
