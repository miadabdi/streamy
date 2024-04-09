import { Module } from '@nestjs/common';
import { MinioClientModule } from '../minio-client/minio-client.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
	imports: [MinioClientModule],
	providers: [FileService],
	controllers: [FileController],
})
export class FileModule {}
