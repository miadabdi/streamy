import { Injectable, PipeTransform } from '@nestjs/common';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class SharpPipe implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>> {
	async transform(image: Express.Multer.File): Promise<Express.Multer.File> {
		const originalName = path.parse(image.originalname).name;
		const filename = originalName + '.jpg';

		image.buffer = await sharp(image.buffer).jpeg({ mozjpeg: true }).toBuffer();
		image.originalname = filename;
		image.mimetype = 'image/jpeg';
		image.size = Buffer.byteLength(image.buffer);

		return image;
	}
}
