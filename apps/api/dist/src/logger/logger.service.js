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
Object.defineProperty(exports, '__esModule', { value: true });
exports.LoggerService = void 0;
const common_1 = require('@nestjs/common');
const cls_1 = require('./cls');
const winston_1 = require('./winston');
let LoggerService = class LoggerService {
	constructor(contextStorageService) {
		this.contextStorageService = contextStorageService;
	}
	log(message, context) {
		const id = this.contextStorageService.getContextId();
		winston_1.logger.log(message, { context, requestId: id });
	}
	verbose(message, context) {
		const id = this.contextStorageService.getContextId();
		winston_1.logger.verbose(message, { context, requestId: id });
	}
	fatal(message, context) {
		const id = this.contextStorageService.getContextId();
		winston_1.logger.error(message, { context, requestId: id });
	}
	error(message, trace, context) {
		const id = this.contextStorageService.getContextId();
		winston_1.logger.error(message, trace, { context, requestId: id });
	}
	warn(message, context) {
		const id = this.contextStorageService.getContextId();
		winston_1.logger.warn(message, { context, requestId: id });
	}
	debug(message, context) {
		const id = this.contextStorageService.getContextId();
		winston_1.logger.debug(message, { context, requestId: id });
	}
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = __decorate(
	[
		(0, common_1.Injectable)(),
		__metadata('design:paramtypes', [cls_1.NestjsClsContextStorageService]),
	],
	LoggerService,
);
//# sourceMappingURL=logger.service.js.map
