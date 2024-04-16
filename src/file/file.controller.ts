import {
	Controller,
	Get,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../common/decorators';
import { JwtAuthGuard } from '../common/guards';
import { SharpPipe } from '../common/pipes/sharp-pipe.pipe';
import { User } from '../drizzle/schema';
import { GetPresignedGetURLDto } from './dto';
import { GetPresignedPutURLDto } from './dto/get-presigned-put-url.dto';
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

	@Get('/get-presigned-put-url')
	@UseGuards(JwtAuthGuard)
	async getPresignedPutURL(
		@Query() getPresignedPutURLDto: GetPresignedPutURLDto,
		@GetUser() user: User,
	) {
		return this.fileService.getPresignedPutURL(getPresignedPutURLDto, user);
	}

	@Get('/get-presigned-get-url')
	@UseGuards(JwtAuthGuard)
	async getPresignedGetURL(
		@Query() getPresignedGetURLDto: GetPresignedGetURLDto,
		@GetUser() user: User,
	) {
		return this.fileService.getPresignedGetURL(getPresignedGetURLDto, user);
	}
}
