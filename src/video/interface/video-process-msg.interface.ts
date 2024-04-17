export interface VideoProcessMsg {
	fileId: number;
	bucketName: string;
	filePath: string;
	sizeInByte: number;
	mimetype: string;
}
