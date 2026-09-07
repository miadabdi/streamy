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
var MinioClientService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.MinioClientService = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const crypto_1 = require('crypto');
const Minio = __importStar(require('minio'));
const nestjs_minio_client_1 = require('nestjs-minio-client');
const path_1 = require('path');
const minio_schema_1 = require('./minio.schema');
let MinioClientService = (MinioClientService_1 = class MinioClientService {
	constructor(minio, configService) {
		this.minio = minio;
		this.configService = configService;
		this.logger = new common_1.Logger(MinioClientService_1.name);
		this.publicClient = new Minio.Client({
			endPoint:
				this.configService.get('MINIO_PUBLIC_ENDPOINT') ?? this.configService.get('MINIO_ENDPOINT'),
			port: Number(
				this.configService.get('MINIO_PUBLIC_PORT') ?? this.configService.get('MINIO_PORT'),
			),
			useSSL: false,
			region: 'default',
			accessKey: this.configService.get('MINIO_ACCESS_KEY'),
			secretKey: this.configService.get('MINIO_SECRET_KEY'),
		});
	}
	get client() {
		return this.minio.client;
	}
	async onModuleInit() {
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				await this.bootstrapBuckets();
				return;
			} catch (err) {
				this.logger.warn(`bucket bootstrap attempt ${attempt} failed: ${err.message}`);
				if (attempt === 3) throw err;
				await new Promise((resolve) => setTimeout(resolve, 10000));
			}
		}
	}
	async bootstrapBuckets() {
		for (const bucket of minio_schema_1.BUCKETS) {
			if (await this.client.bucketExists(bucket.name)) {
				this.logger.log(`Bucket ${bucket.name} exists`);
			} else {
				this.logger.log(`About to create bucket ${bucket.name}`);
				try {
					await this.client.makeBucket(bucket.name, 'default');
					this.logger.log(`Bucket ${bucket.name} created`);
				} catch (err) {
					if (await this.client.bucketExists(bucket.name)) {
						this.logger.log(`Bucket ${bucket.name} already created concurrently`);
					} else {
						throw err;
					}
				}
				this.logger.log(`About to set policy on bucket ${bucket.name}`);
				await this.client.setBucketPolicy(bucket.name, JSON.stringify(bucket.policy));
				this.logger.log(`Policy set on bucket ${bucket.name}`);
			}
		}
	}
	async presignedPutUrl(bucketName, path, expiry) {
		const bucket = minio_schema_1.BUCKETS.find((bucket) => bucket.name === bucketName);
		const random = (0, crypto_1.randomBytes)(8).toString('hex');
		const name = (0, path_1.basename)(path);
		const dir = (0, path_1.dirname)(path);
		const randomFileName = `${dir != '.' ? dir + '/' : ''}${random}-${name}`;
		const url = await this.publicClient.presignedPutObject(bucket.name, randomFileName, expiry);
		return {
			url,
			randomFileName,
		};
	}
	async presignedGetUrl(bucketName, path, expiry) {
		const bucket = minio_schema_1.BUCKETS.find((bucket) => bucket.name === bucketName);
		const url = await this.publicClient.presignedGetObject(bucket.name, path, expiry);
		return url;
	}
	async putObject(file, directory, bucketName, contentType) {
		const bucket = minio_schema_1.BUCKETS.find((bucket) => bucket.name === bucketName);
		if (!bucket) {
			this.logger.error(
				`Error putting object into bucker ${bucketName}, filename: ${file.filename}, mimetype: ${file.mimetype}`,
			);
			throw new common_1.InternalServerErrorException('Error uploading file');
		}
		const allowedMimeTypes = bucket.allowedMimeTypes;
		if (!allowedMimeTypes.includes(file.mimetype)) {
			throw new common_1.BadRequestException('File type not supported');
		}
		const metaData = {
			'Content-Type': contentType ? contentType : file.mimetype,
		};
		const timestamp = Date.now().toString();
		const hashedFileName = (0, crypto_1.createHash)('md5').update(timestamp).digest('hex');
		const extension = file.originalname.substring(
			file.originalname.lastIndexOf('.'),
			file.originalname.length,
		);
		const fileName = hashedFileName + extension;
		const completePath = (0, path_1.join)(directory, fileName);
		try {
			await this.client.putObject(bucketName, completePath, file.buffer, metaData);
			const minioEndpoint =
				this.configService.get('MINIO_PUBLIC_ENDPOINT') ?? this.configService.get('MINIO_ENDPOINT');
			const minioPort =
				this.configService.get('MINIO_PUBLIC_PORT') ?? this.configService.get('MINIO_PORT');
			return {
				url: `${minioEndpoint}:${minioPort}/${bucketName}/${completePath}`,
				path: completePath,
				bucketName,
				mimetype: file.mimetype,
				size: file.size,
			};
		} catch (err) {
			this.logger.error(err.message, err.stack);
			throw new common_1.BadRequestException('Error uploading file');
		}
	}
	async delete(objectName, bucketName) {
		try {
			await this.client.removeObject(bucketName, objectName);
		} catch (err) {
			this.logger.error(err);
			throw new common_1.BadRequestException('An error occured when deleting!');
		}
	}
});
exports.MinioClientService = MinioClientService;
exports.MinioClientService =
	MinioClientService =
	MinioClientService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					nestjs_minio_client_1.MinioService,
					config_1.ConfigService,
				]),
			],
			MinioClientService,
		);
//# sourceMappingURL=minio-client.service.js.map
