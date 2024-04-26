import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BUCKET_NAMES, BUCKET_NAMES_TYPE } from '../../minio-client/minio.schema';

export class CreateFileDto {
	@IsEnum(BUCKET_NAMES)
	bucketName: BUCKET_NAMES_TYPE;

	@IsString()
	@IsNotEmpty()
	path: string;

	@IsOptional()
	@IsInt()
	@Type(() => Number)
	sizeInByte?: number;

	@IsOptional()
	mimetype?: string;
}
