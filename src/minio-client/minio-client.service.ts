import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import moment from 'moment';
import { MinioService, MinioClient } from 'nestjs-minio-client';
import { basename, dirname, join } from 'path';
import { BUCKETS, BUCKET_NAMES_TYPE } from './minio.schema';
import { PostPolicyResult } from 'minio';

@Injectable()
export class MinioClientService {
	private logger = new Logger(MinioClientService.name);

	constructor(
		private readonly minio: MinioService,
		private configService: ConfigService,
	) {}

	public get client(): MinioClient {
		return this.minio.client;
	}

	async onModuleInit() {
		for (const bucket of BUCKETS) {
			// creating and configuring buckets
			if (await this.client.bucketExists(bucket.name)) {
				this.logger.log(`Bucket ${bucket.name} exists`);
			} else {
				this.logger.log(`About to create bucket ${bucket.name}`);
				await this.client.makeBucket(bucket.name, 'default');
				this.logger.log(`Bucket ${bucket.name} created`);

				this.logger.log(`About to set policy on bucket ${bucket.name}`);
				await this.client.setBucketPolicy(bucket.name, JSON.stringify(bucket.policy));
				this.logger.log(`Policy set on bucket ${bucket.name}`);
			}
		}
	}

	/**
	 * creates a presigned post url
	 * @param {BUCKET_NAMES_TYPE} bucketName
	 * @param {string} fileName
	 * @param {string[]} mimetypes
	 * @param {number} expiryDays
	 * @returns {PostPolicyResult}
	 */
	async presignedPostUrl(
		bucketName: BUCKET_NAMES_TYPE,
		fileName: string,
		mimetypes: string[],
		expiryDays: number,
		minMB: number = 0.01,
		maxMB: number = 10,
	): Promise<PostPolicyResult> {
		const bucket = BUCKETS.find((bucket) => bucket.name === bucketName);

		// Construct a new postPolicy.
		const policy = this.minio.client.newPostPolicy();
		// Set the object name my-objectname.
		policy.setKey(fileName);
		// Set the bucket to my-bucketname.
		policy.setBucket(bucket.name);

		for (const mimetype of mimetypes) {
			policy.setContentType(mimetype);
		}

		const expires = moment().add(expiryDays, 'days');
		policy.setExpires(expires.toDate());

		policy.setContentLengthRange(minMB * 1024 * 1024, maxMB * 1024 * 1024);
		policy.setUserMetaData({
			channel: 22,
		});

		const preSigned = await this.minio.client.presignedPostPolicy(policy);

		return preSigned;
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
		const url = await this.minio.client.presignedPutObject(bucket.name, randomFileName, expiry);

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
		const url = await this.minio.client.presignedGetObject(bucket.name, path, expiry);

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

			const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT');
			const minioPort = this.configService.get<string>('MINIO_PORT');

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
