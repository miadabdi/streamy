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
exports.LiveController = void 0;
const common_1 = require('@nestjs/common');
const dto_1 = require('./dto');
const live_service_1 = require('./live.service');
let LiveController = class LiveController {
	constructor(liveService) {
		this.liveService = liveService;
	}
	srsOnPublish(srsOnPublishDto) {
		return this.liveService.srsOnPublish(srsOnPublishDto);
	}
	srsOnUnpublish(srsOnUnpublishDto) {
		return this.liveService.srsOnUnpublish(srsOnUnpublishDto);
	}
	srsOnPlay(srsOnPlayDto) {
		return this.liveService.srsOnPlay(srsOnPlayDto);
	}
	srsOnStop(srsOnStopDto) {
		return this.liveService.srsOnStop(srsOnStopDto);
	}
};
exports.LiveController = LiveController;
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/on_publish'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.OnPublishDto]),
		__metadata('design:returntype', void 0),
	],
	LiveController.prototype,
	'srsOnPublish',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/on_unpublish'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.OnUnpublishDto]),
		__metadata('design:returntype', void 0),
	],
	LiveController.prototype,
	'srsOnUnpublish',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/on_play'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.OnPlayDto]),
		__metadata('design:returntype', void 0),
	],
	LiveController.prototype,
	'srsOnPlay',
	null,
);
__decorate(
	[
		(0, common_1.HttpCode)(common_1.HttpStatus.OK),
		(0, common_1.Post)('/on_stop'),
		__param(0, (0, common_1.Body)()),
		__metadata('design:type', Function),
		__metadata('design:paramtypes', [dto_1.OnStopDto]),
		__metadata('design:returntype', void 0),
	],
	LiveController.prototype,
	'srsOnStop',
	null,
);
exports.LiveController = LiveController = __decorate(
	[(0, common_1.Controller)('live'), __metadata('design:paramtypes', [live_service_1.LiveService])],
	LiveController,
);
//# sourceMappingURL=live.controller.js.map
