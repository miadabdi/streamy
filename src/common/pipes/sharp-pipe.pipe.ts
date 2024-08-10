import { ArgumentMetadata, DefaultValuePipe, Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class SharpPipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>> {
	constructor(private size: { height: number; width: number }) {}

	async transform(
		image: Express.Multer.File,
		metadata: ArgumentMetadata,
	): Promise<Express.Multer.File> {
		if (!image) return image;

		const originalName = path.parse(image.originalname).name;
		const filename = originalName + '.jpg';

		DefaultValuePipe;
		image.buffer = await sharp(image.buffer)
			.resize({ height: this.size.height, width: this.size.width, fit: 'cover' })
			.jpeg({ mozjpeg: true })
			.toBuffer();
		image.originalname = filename;
		image.mimetype = 'image/jpeg';
		image.size = Buffer.byteLength(image.buffer);

		return image;
	}
}
