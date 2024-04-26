import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { BUCKET_NAMES, BUCKET_NAMES_TYPE } from '../../minio-client/minio.schema';

export class GetPresignedPutURLDto {
	@IsString()
	@IsNotEmpty()
	path: string;

	@IsString()
	@IsNotEmpty()
	@IsEnum(BUCKET_NAMES)
	bucket: BUCKET_NAMES_TYPE;
}
