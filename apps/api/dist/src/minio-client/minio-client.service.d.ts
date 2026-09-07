import { ConfigService } from '@nestjs/config';
import { MinioService, MinioClient } from 'nestjs-minio-client';
import { BUCKET_NAMES_TYPE } from './minio.schema';
export declare class MinioClientService {
	private readonly minio;
	private configService;
	private logger;
	private readonly publicClient;
	constructor(minio: MinioService, configService: ConfigService);
	get client(): MinioClient;
	onModuleInit(): Promise<void>;
	private bootstrapBuckets;
	presignedPutUrl(
		bucketName: BUCKET_NAMES_TYPE,
		path: string,
		expiry: number,
	): Promise<{
		url: string;
		randomFileName: string;
	}>;
	presignedGetUrl(bucketName: BUCKET_NAMES_TYPE, path: string, expiry: number): Promise<string>;
	putObject(
		file: Express.Multer.File,
		directory: string,
		bucketName: BUCKET_NAMES_TYPE,
		contentType?: string,
	): Promise<{
		url: string;
		path: string;
		bucketName:
			| 'videos'
			| 'public'
			| 'images'
			| 'hls'
			| 'channelavatars'
			| 'videothumbnails'
			| 'subtitlefiles';
		mimetype: string;
		size: number;
	}>;
	delete(objectName: string, bucketName: BUCKET_NAMES_TYPE): Promise<undefined>;
}
