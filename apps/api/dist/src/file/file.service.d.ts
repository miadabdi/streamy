import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { File, User } from '../drizzle/schema';
import { MinioClientService } from '../minio-client/minio-client.service';
import { BUCKET_NAMES_TYPE } from '../minio-client/minio.schema';
import { GetPresignedGetURLDto } from './dto';
import { CreateFileDto } from './dto/create-file.dto';
import { GetPresignedPutURLDto } from './dto/get-presigned-put-url.dto';
import { PresignedUrlResponse } from './interface';
export declare class FileService {
	private minioClientService;
	private drizzleService;
	private logger;
	constructor(minioClientService: MinioClientService, drizzleService: DrizzleService);
	getPresignedPutURL(
		getPresignedPutURLDto: GetPresignedPutURLDto,
		user: User,
	): Promise<PresignedUrlResponse>;
	getPresignedGetURL(getPresignedGetURLDto: GetPresignedGetURLDto, user: User): Promise<string>;
	uploadAndCreateFileRecord(
		file: Express.Multer.File,
		directory: string,
		bucketName: BUCKET_NAMES_TYPE,
		user: User,
	): Promise<File>;
	createFileRecord(createFileDto: CreateFileDto, user: User): Promise<File>;
	uploadImage(image: Express.Multer.File, user: schema.User): Promise<File>;
}
