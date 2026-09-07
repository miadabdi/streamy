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
exports.CreateVideoDto = void 0;
const class_transformer_1 = require('class-transformer');
const class_validator_1 = require('class-validator');
const default_value_decorator_1 = require('../../common/decorators/default-value.decorator');
const schema_1 = require('../../drizzle/schema');
class CreateVideoDto {}
exports.CreateVideoDto = CreateVideoDto;
__decorate(
	[
		(0, class_validator_1.IsString)(),
		(0, class_validator_1.Length)(3, 255),
		__metadata('design:type', String),
	],
	CreateVideoDto.prototype,
	'name',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsString)(),
		(0, class_validator_1.Length)(8, 2048),
		__metadata('design:type', String),
	],
	CreateVideoDto.prototype,
	'description',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	CreateVideoDto.prototype,
	'channelId',
	void 0,
);
__decorate(
	[(0, class_validator_1.IsEnum)(schema_1.videoTypeEnum), __metadata('design:type', String)],
	CreateVideoDto.prototype,
	'type',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsArray)(),
		(0, class_validator_1.IsInt)({ each: true }),
		(0, default_value_decorator_1.Default)([]),
		__metadata('design:type', Array),
	],
	CreateVideoDto.prototype,
	'tagIds',
	void 0,
);
//# sourceMappingURL=create-video.dto.js.map
