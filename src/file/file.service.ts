import { Injectable, Logger } from '@nestjs/common';
import { BUCKET_NAMES_TYPE } from '../common/constants';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { filesTableColumns } from '../drizzle/table-columns';
import { MinioClientService } from '../minio-client/minio-client.service';

@Injectable()
export class FileService {
	private logger = new Logger(FileService.name);

	constructor(
		private minioClientService: MinioClientService,
		private drizzleService: DrizzleService,
	) {}

	async upload(
		file: Express.Multer.File,
		directory: string,
		bucketName: BUCKET_NAMES_TYPE,
		user: schema.User,
	) {
		const result = await this.minioClientService.putObject(file, directory, bucketName);

		const fileRecord = await this.drizzleService.db
			.insert(schema.files)
			.values({
				bucketName: result.bucketName,
				path: result.path,
				sizeInByte: result.size,
				mimetype: result.mimetype,
				userId: user.id,
			})
			.returning(filesTableColumns);

		return fileRecord[0];
	}

	async uploadImage(image: Express.Multer.File, user: schema.User) {
		return this.upload(image, '', 'images', user);
	}
}
