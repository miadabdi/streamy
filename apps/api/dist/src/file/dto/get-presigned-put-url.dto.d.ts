import { BUCKET_NAMES_TYPE } from '../../minio-client/minio.schema';
export declare class GetPresignedPutURLDto {
	path: string;
	bucket: BUCKET_NAMES_TYPE;
}
