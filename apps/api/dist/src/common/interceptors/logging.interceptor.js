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
var LoggingInterceptor_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require('@nestjs/common');
let LoggingInterceptor = (LoggingInterceptor_1 = class LoggingInterceptor {
	constructor() {
		this.logger = new common_1.Logger(LoggingInterceptor_1.name);
	}
	intercept(context, next) {
		const ctx = context.switchToHttp();
		const request = ctx.getRequest();
		const user = request.user;
		this.logger.verbose(
			`Calling ${request.method.toUpperCase()} ${request.originalUrl} \n with body ${JSON.stringify(request.body)} \n and user id ${user?.id}`,
		);
		return next.handle();
	}
});
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor =
	LoggingInterceptor =
	LoggingInterceptor_1 =
		__decorate([(0, common_1.Injectable)()], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map
