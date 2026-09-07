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
exports.CreateFileDto = void 0;
const class_transformer_1 = require('class-transformer');
const class_validator_1 = require('class-validator');
const minio_schema_1 = require('../../minio-client/minio.schema');
class CreateFileDto {}
exports.CreateFileDto = CreateFileDto;
__decorate(
	[(0, class_validator_1.IsEnum)(minio_schema_1.BUCKET_NAMES), __metadata('design:type', String)],
	CreateFileDto.prototype,
	'bucketName',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsString)(),
		(0, class_validator_1.IsNotEmpty)(),
		__metadata('design:type', String),
	],
	CreateFileDto.prototype,
	'path',
	void 0,
);
__decorate(
	[
		(0, class_validator_1.IsOptional)(),
		(0, class_validator_1.IsInt)(),
		(0, class_transformer_1.Type)(() => Number),
		__metadata('design:type', Number),
	],
	CreateFileDto.prototype,
	'sizeInByte',
	void 0,
);
__decorate(
	[(0, class_validator_1.IsOptional)(), __metadata('design:type', String)],
	CreateFileDto.prototype,
	'mimetype',
	void 0,
);
//# sourceMappingURL=create-file.dto.js.map
