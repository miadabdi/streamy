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
exports.CreateChannelDto = void 0;
const class_validator_1 = require('class-validator');
const constants_1 = require('../../common/constants');
class CreateChannelDto {}
exports.CreateChannelDto = CreateChannelDto;
__decorate(
	[
		(0, class_validator_1.Matches)(new RegExp(constants_1.CHANNEL_USERNAME_REGEX), {
			message: 'Channel username must contain no _ or . at the beginning or end',
		}),
		(0, class_validator_1.IsString)(),
		(0, class_validator_1.Length)(8, 128),
		__metadata('design:type', String),
	],
	CreateChannelDto.prototype,
	'username',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsString)(),
		(0, class_validator_1.Length)(3, 50),
		__metadata('design:type', String),
	],
	CreateChannelDto.prototype,
	'name',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsString)(),
		(0, class_validator_1.Length)(8, 1024),
		__metadata('design:type', String),
	],
	CreateChannelDto.prototype,
	'description',
	void 0,
);
//# sourceMappingURL=create-channel.dto.js.map
