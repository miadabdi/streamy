export interface IFile {
	/** Name of the file on the uploader's computer. */
	originalname: string;
	/** Value of the `Content-Type` header for this file. */
	mimetype: string;
	/** Size of the file in bytes. */
	size: number;
	/** `MemoryStorage` only: A Buffer containing the entire file. */
	buffer: Buffer;
}
