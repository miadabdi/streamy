import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { SharpPipe } from '../common/pipes/sharp-pipe.pipe';
import { User } from '../drizzle/schema';
import { FileService } from './file.service';

@Controller('file')
export class FileController {
	constructor(private fileService: FileService) {}

	@Post('/upload-image')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('image'))
	async uploadImage(@UploadedFile(SharpPipe) image: Express.Multer.File, @GetUser() user: User) {
		return this.fileService.uploadImage(image, user);
	}
}
