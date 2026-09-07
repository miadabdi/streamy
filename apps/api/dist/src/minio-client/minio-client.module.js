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
Object.defineProperty(exports, '__esModule', { value: true });
exports.MinioClientModule = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const nestjs_minio_client_1 = require('nestjs-minio-client');
const minio_client_controller_1 = require('./minio-client.controller');
const minio_client_service_1 = require('./minio-client.service');
let MinioClientModule = class MinioClientModule {};
exports.MinioClientModule = MinioClientModule;
exports.MinioClientModule = MinioClientModule = __decorate(
	[
		(0, common_1.Module)({
			imports: [
				nestjs_minio_client_1.MinioModule.registerAsync({
					imports: [config_1.ConfigModule],
					useFactory: async (configService) => ({
						endPoint: configService.get('MINIO_ENDPOINT'),
						port: configService.get('MINIO_PORT'),
						useSSL: false,
						accessKey: configService.get('MINIO_ACCESS_KEY'),
						secretKey: configService.get('MINIO_SECRET_KEY'),
					}),
					inject: [config_1.ConfigService],
				}),
			],
			providers: [minio_client_service_1.MinioClientService],
			controllers: [minio_client_controller_1.MinioClientController],
			exports: [minio_client_service_1.MinioClientService],
		}),
	],
	MinioClientModule,
);
//# sourceMappingURL=minio-client.module.js.map
