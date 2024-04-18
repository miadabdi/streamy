export interface SubProcessMsg {
	id: number;
	langRFC5646: string;
	fileId: number;
	filePath: string;
	bucketName: string;
	sizeInByte: number;
	mimetype: string;
}

export interface VideoProcessMsg {
	videoId: number;
	fileId: number;
	bucketName: string;
	filePath: string;
	sizeInByte: number;
	mimetype: string;
	subs: SubProcessMsg[];
}
