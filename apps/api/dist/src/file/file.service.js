'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
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
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
var FileService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.FileService = void 0;
const common_1 = require('@nestjs/common');
const drizzle_service_1 = require('../drizzle/drizzle.service');
const schema = __importStar(require('../drizzle/schema'));
const table_columns_1 = require('../drizzle/table-columns');
const minio_client_service_1 = require('../minio-client/minio-client.service');
let FileService = (FileService_1 = class FileService {
	constructor(minioClientService, drizzleService) {
		this.minioClientService = minioClientService;
		this.drizzleService = drizzleService;
		this.logger = new common_1.Logger(FileService_1.name);
	}
	async getPresignedPutURL(getPresignedPutURLDto, user) {
		const { url, randomFileName } = await this.minioClientService.presignedPutUrl(
			getPresignedPutURLDto.bucket,
			getPresignedPutURLDto.path,
			3600,
		);
		const fileRecord = await this.createFileRecord(
			{
				bucketName: getPresignedPutURLDto.bucket,
				path: randomFileName,
			},
			user,
		);
		return { url, fileRecord };
	}
	async getPresignedGetURL(getPresignedGetURLDto, user) {
		return this.minioClientService.presignedGetUrl(
			getPresignedGetURLDto.bucket,
			getPresignedGetURLDto.path,
			3600,
		);
	}
	async uploadAndCreateFileRecord(file, directory, bucketName, user) {
		const result = await this.minioClientService.putObject(file, directory, bucketName);
		const fileRecord = await this.createFileRecord(
			{
				bucketName: result.bucketName,
				path: result.path,
				sizeInByte: result.size,
				mimetype: result.mimetype,
			},
			user,
		);
		return fileRecord;
	}
	async createFileRecord(createFileDto, user) {
		const fileRecord = await this.drizzleService.db
			.insert(schema.files)
			.values({
				...createFileDto,
				userId: user.id,
			})
			.returning(table_columns_1.filesTableColumns);
		return fileRecord[0];
	}
	async uploadImage(image, user) {
		return this.uploadAndCreateFileRecord(image, '', 'images', user);
	}
});
exports.FileService = FileService;
exports.FileService =
	FileService =
	FileService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					minio_client_service_1.MinioClientService,
					drizzle_service_1.DrizzleService,
				]),
			],
			FileService,
		);
//# sourceMappingURL=file.service.js.map
