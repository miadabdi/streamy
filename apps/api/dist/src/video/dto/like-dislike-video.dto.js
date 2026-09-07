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
exports.LikeDislikeVideoDto = exports.ILikeType = void 0;
const class_transformer_1 = require('class-transformer');
const class_validator_1 = require('class-validator');
var ILikeType;
(function (ILikeType) {
	ILikeType['like'] = 'like';
	ILikeType['dislike'] = 'dislike';
	ILikeType['unlike'] = 'unlike';
	ILikeType['undislike'] = 'undislike';
})(ILikeType || (exports.ILikeType = ILikeType = {}));
class LikeDislikeVideoDto {}
exports.LikeDislikeVideoDto = LikeDislikeVideoDto;
__decorate(
	[(0, class_validator_1.IsEnum)(ILikeType), __metadata('design:type', String)],
	LikeDislikeVideoDto.prototype,
	'type',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	LikeDislikeVideoDto.prototype,
	'videoId',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	LikeDislikeVideoDto.prototype,
	'likerChannelId',
	void 0,
);
//# sourceMappingURL=like-dislike-video.dto.js.map
