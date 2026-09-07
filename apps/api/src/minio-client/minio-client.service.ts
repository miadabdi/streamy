import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as Minio from 'minio';
import { MinioService, MinioClient } from 'nestjs-minio-client';
import { basename, dirname, join } from 'path';
import { BUCKETS, BUCKET_NAMES_TYPE } from './minio.schema';

@Injectable()
export class MinioClientService {
	private logger = new Logger(MinioClientService.name);

	/** signs presigned urls against the client-facing endpoint */
	private readonly publicClient: Minio.Client;

	constructor(
		private readonly minio: MinioService,
		private configService: ConfigService,
	) {
		this.publicClient = new Minio.Client({
			endPoint:
				this.configService.get<string>('MINIO_PUBLIC_ENDPOINT') ??
				this.configService.get<string>('MINIO_ENDPOINT'),
			port: Number(
				this.configService.get('MINIO_PUBLIC_PORT') ?? this.configService.get('MINIO_PORT'),
			),
			useSSL: false,
			// pinning the region keeps presigning a purely local operation; the
			// default region probe would otherwise dial the public endpoint from
			// inside the container, where it is unreachable
			region: 'default',
			accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
			secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
		});
	}

	public get client(): MinioClient {
		return this.minio.client;
	}

	async onModuleInit() {
		// storage can lag behind its healthcheck right after a stack recreate;
		// a boot-time blip should not kill the app
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

	private async bootstrapBuckets() {
		for (const bucket of BUCKETS) {
			// creating and configuring buckets
			if (await this.client.bucketExists(bucket.name)) {
				this.logger.log(`Bucket ${bucket.name} exists`);
			} else {
				this.logger.log(`About to create bucket ${bucket.name}`);
				// the process node creates the same buckets concurrently; tolerate the race
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

	/**
	 * creates a presigned put url
	 * @param {BUCKET_NAMES_TYPE} bucketName
	 * @param {string} path path of file in bucket
	 * @param {number} expiry url expires in seconds
	 * @returns {{ url: string, randomFileName: string }}
	 */
	async presignedPutUrl(
		bucketName: BUCKET_NAMES_TYPE,
		path: string,
		expiry: number,
	): Promise<{ url: string; randomFileName: string }> {
		const bucket = BUCKETS.find((bucket) => bucket.name === bucketName);

		const random = randomBytes(8).toString('hex');
		const name = basename(path);
		const dir = dirname(path);

		const randomFileName = `${dir != '.' ? dir + '/' : ''}${random}-${name}`;

		// expiry in seconds
		const url = await this.publicClient.presignedPutObject(bucket.name, randomFileName, expiry);

		return {
			url,
			randomFileName,
		};
	}

	/**
	 * creates a presigned get url
	 * @param {BUCKET_NAMES_TYPE} bucketName
	 * @param {string} path path of file in bucket
	 * @param {number} expiry url expires in seconds
	 * @returns {string}
	 */
	async presignedGetUrl(bucketName: BUCKET_NAMES_TYPE, path: string, expiry: number) {
		const bucket = BUCKETS.find((bucket) => bucket.name === bucketName);

		// expiry in seconds
		const url = await this.publicClient.presignedGetObject(bucket.name, path, expiry);

		return url;
	}

	/**
	 * creates a presigned get url
	 * @param {Express.Multer.File} file file in memory
	 * @param {string} directory directory of file in bucket
	 * @param {BUCKET_NAMES_TYPE} bucketName
	 * @param {string} [contentType] content type of file (e.g. video/mp4)
	 * @returns {string}
	 */
	async putObject(
		file: Express.Multer.File,
		directory: string,
		bucketName: BUCKET_NAMES_TYPE,
		contentType?: string,
	) {
		const bucket = BUCKETS.find((bucket) => bucket.name === bucketName);

		if (!bucket) {
			this.logger.error(
				`Error putting object into bucker ${bucketName}, filename: ${file.filename}, mimetype: ${file.mimetype}`,
			);
			throw new InternalServerErrorException('Error uploading file');
		}

		const allowedMimeTypes = bucket.allowedMimeTypes as unknown as string[];
		if (!allowedMimeTypes.includes(file.mimetype)) {
			throw new BadRequestException('File type not supported');
		}

		const metaData = {
			'Content-Type': contentType ? contentType : file.mimetype,
		};

		const timestamp = Date.now().toString();
		const hashedFileName = createHash('md5').update(timestamp).digest('hex');
		const extension = file.originalname.substring(
			file.originalname.lastIndexOf('.'),
			file.originalname.length,
		);

		// We need to append the extension at the end otherwise Minio will save it as a generic file
		const fileName = hashedFileName + extension;
		const completePath = join(directory, fileName);

		try {
			await this.client.putObject(bucketName, completePath, file.buffer, metaData);

			const minioEndpoint =
				this.configService.get<string>('MINIO_PUBLIC_ENDPOINT') ??
				this.configService.get<string>('MINIO_ENDPOINT');
			const minioPort =
				this.configService.get<string>('MINIO_PUBLIC_PORT') ??
				this.configService.get<string>('MINIO_PORT');

			return {
				url: `${minioEndpoint}:${minioPort}/${bucketName}/${completePath}`,
				path: completePath,
				bucketName,
				mimetype: file.mimetype,
				size: file.size,
			};
		} catch (err: any) {
			this.logger.error(err.message, err.stack);
			throw new BadRequestException('Error uploading file');
		}
	}

	/**
	 * deletes an object
	 * @param {string} objectName
	 * @param {BUCKET_NAMES_TYPE} bucketName
	 * @returns {undefined}
	 */
	async delete(objectName: string, bucketName: BUCKET_NAMES_TYPE): Promise<undefined> {
		try {
			await this.client.removeObject(bucketName, objectName);
		} catch (err) {
			this.logger.error(err);
			throw new BadRequestException('An error occured when deleting!');
		}
	}
}
