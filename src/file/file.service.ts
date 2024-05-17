import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { File, User } from '../drizzle/schema';
import { filesTableColumns } from '../drizzle/table-columns';
import { MinioClientService } from '../minio-client/minio-client.service';
import { BUCKET_NAMES_TYPE } from '../minio-client/minio.schema';
import { GetPresignedGetURLDto } from './dto';
import { CreateFileDto } from './dto/create-file.dto';
import { GetPresignedPutURLDto } from './dto/get-presigned-put-url.dto';
import { PresignedUrlResponse } from './interface';

@Injectable()
export class FileService {
	private logger = new Logger(FileService.name);

	constructor(
		private minioClientService: MinioClientService,
		private drizzleService: DrizzleService,
	) {}

	/**
	 * creates a presigned put url and file record
	 * @param {GetPresignedPutURLDto} getPresignedPutURLDto
	 * @param {User} user
	 * @returns {PresignedUrlResponse}
	 */
	async getPresignedPutURL(
		getPresignedPutURLDto: GetPresignedPutURLDto,
		user: User,
	): Promise<PresignedUrlResponse> {
		// return this.minioClientService.presignedPostUrl('images', 'random.png', ['image/png'], 5);

		const { url, randomFileName } = await this.minioClientService.presignedUrl(
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

	/**
	 * creates a presigned get url
	 * @param {getPresignedGetURLDto} GetPresignedGetURLDto
	 * @param {User} user
	 * @returns {string}
	 */
	async getPresignedGetURL(
		getPresignedGetURLDto: GetPresignedGetURLDto,
		user: User,
	): Promise<string> {
		return this.minioClientService.presignedGetUrl(
			getPresignedGetURLDto.bucket,
			getPresignedGetURLDto.path,
			3600,
		);
	}

	/**
	 * upload file in memory to minio and returns created file record
	 * @param {Express.Multer.File} file
	 * @param {string} directory
	 * @param {BUCKET_NAMES_TYPE} bucketName
	 * @param {User} user
	 * @returns {File}
	 */
	async uploadAndCreateFileRecord(
		file: Express.Multer.File,
		directory: string,
		bucketName: BUCKET_NAMES_TYPE,
		user: User,
	): Promise<File> {
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

	/**
	 * creates file record
	 * @param {CreateFileDto} createFileDto
	 * @param {User} user
	 * @returns {File}
	 */
	async createFileRecord(createFileDto: CreateFileDto, user: User): Promise<File> {
		const fileRecord = await this.drizzleService.db
			.insert(schema.files)
			.values({
				...createFileDto,
				userId: user.id,
			})
			.returning(filesTableColumns);

		return fileRecord[0];
	}

	/**
	 * uploads an image and returns created file record
	 * @param {Express.Multer.File} image file in memory
	 * @param {User} user
	 * @returns {File}
	 */
	async uploadImage(image: Express.Multer.File, user: schema.User): Promise<File> {
		return this.uploadAndCreateFileRecord(image, '', 'images', user);
	}
}
