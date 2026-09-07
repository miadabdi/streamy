import { User } from '../drizzle/schema';
import { GetPresignedGetURLDto } from './dto';
import { GetPresignedPutURLDto } from './dto/get-presigned-put-url.dto';
import { FileService } from './file.service';
export declare class FileController {
	private fileService;
	constructor(fileService: FileService);
	uploadImage(
		image: Express.Multer.File,
		user: User,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		bucketName: string;
		path: string;
		mimetype: string;
		sizeInByte: number;
		userId: number;
	}>;
	getPresignedPutURL(
		getPresignedPutURLDto: GetPresignedPutURLDto,
		user: User,
	): Promise<import('./interface').PresignedUrlResponse>;
	getPresignedGetURL(getPresignedGetURLDto: GetPresignedGetURLDto, user: User): Promise<string>;
}
