export interface VideoProcessMsg {
	videoId: number;
	fileId: number;
	bucketName: string;
	filePath: string;
	sizeInByte: number;
	mimetype: string;
}
