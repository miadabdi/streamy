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
exports.GetVideosDto = void 0;
const class_transformer_1 = require('class-transformer');
const class_validator_1 = require('class-validator');
const schema_1 = require('../../drizzle/schema');
class GetVideosDto {
	constructor() {
		this.offset = 0;
		this.limit = 10;
		this.includeNotReleased = false;
		this.onlySubbed = false;
		this.type = schema_1.videoTypeEnum.vod;
	}
}
exports.GetVideosDto = GetVideosDto;
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	GetVideosDto.prototype,
	'offset',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	GetVideosDto.prototype,
	'limit',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	GetVideosDto.prototype,
	'channelId',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsBoolean)(),
		(0, class_transformer_1.Transform)(({ value }) => value === 'true'),
		__metadata('design:type', Boolean),
	],
	GetVideosDto.prototype,
	'includeNotReleased',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsBoolean)(),
		(0, class_transformer_1.Transform)(({ value }) => value === 'true'),
		__metadata('design:type', Boolean),
	],
	GetVideosDto.prototype,
	'onlySubbed',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsEnum)(schema_1.videoTypeEnum),
		__metadata('design:type', String),
	],
	GetVideosDto.prototype,
	'type',
	void 0,
);
//# sourceMappingURL=get-videos.js.map
