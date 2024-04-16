import { Injectable, Logger } from '@nestjs/common';
import { BUCKET_NAMES_TYPE } from '../common/constants';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { filesTableColumns } from '../drizzle/table-columns';
import { MinioClientService } from '../minio-client/minio-client.service';
import { GetPresignedGetURLDto } from './dto';
import { CreateFileDto } from './dto/create-file.dto';
import { GetPresignedPutURLDto } from './dto/get-presigned-put-url.dto';

@Injectable()
export class FileService {
	private logger = new Logger(FileService.name);

	constructor(
		private minioClientService: MinioClientService,
		private drizzleService: DrizzleService,
	) {}

	async getPresignedPutURL(getPresignedPutURLDto: GetPresignedPutURLDto, user: User) {
		// return this.minioClientService.presignedPostUrl('images', 'random.png', ['image/png'], 5);

		const { url, randomFileName } = await this.minioClientService.presignedUrl(
			getPresignedPutURLDto.bucket,
			getPresignedPutURLDto.path,
			3600,
		);

		await this.createFileRecord(
			{
				bucketName: getPresignedPutURLDto.bucket,
				path: randomFileName,
			},
			user,
		);

		return url;
	}

	async getPresignedGetURL(getPresignedGetURLDto: GetPresignedGetURLDto, user: User) {
		return this.minioClientService.presignedGetUrl(
			getPresignedGetURLDto.bucket,
			getPresignedGetURLDto.path,
			3600,
		);
	}

	async uploadAndCreateFileRecord(
		file: Express.Multer.File,
		directory: string,
		bucketName: BUCKET_NAMES_TYPE,
		user: User,
	) {
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

	async createFileRecord(createFileDto: CreateFileDto, user: User) {
		const fileRecord = await this.drizzleService.db
			.insert(schema.files)
			.values({
				...createFileDto,
				userId: user.id,
			})
			.returning(filesTableColumns);

		return fileRecord[0];
	}

	async uploadImage(image: Express.Multer.File, user: schema.User) {
		return this.uploadAndCreateFileRecord(image, '', 'images', user);
	}
}
