import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
export declare class SharpPipe
	implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
	private size;
	constructor(size: { height: number; width: number });
	transform(image: Express.Multer.File, metadata: ArgumentMetadata): Promise<Express.Multer.File>;
}
