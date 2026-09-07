import { File } from '../../drizzle/schema';

export interface PresignedUrlResponse {
	url: string;
	fileRecord: File;
}
