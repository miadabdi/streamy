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
var AllExceptionsFilter_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require('@nestjs/common');
const core_1 = require('@nestjs/core');
let AllExceptionsFilter = (AllExceptionsFilter_1 = class AllExceptionsFilter extends (
	core_1.BaseExceptionFilter
) {
	constructor() {
		super(...arguments);
		this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
	}
	catch(exception, host) {
		if (!(exception instanceof common_1.HttpException) && exception instanceof Error) {
			const ctx = host.switchToHttp();
			const request = ctx.getRequest();
			const user = request.user;
			const errorMessage = `${exception.message} \nCalling ${request.originalUrl}\n with body ${JSON.stringify(request.body)}\n and user id ${user?.id}`;
			this.logger.error(errorMessage, exception.stack);
		}
		super.catch(exception, host);
	}
});
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter =
	AllExceptionsFilter =
	AllExceptionsFilter_1 =
		__decorate([(0, common_1.Catch)()], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map
