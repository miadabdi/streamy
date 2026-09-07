import { BUCKET_NAMES_TYPE } from '../../minio-client/minio.schema';
export declare class CreateFileDto {
	bucketName: BUCKET_NAMES_TYPE;
	path: string;
	sizeInByte?: number;
	mimetype?: string;
}
