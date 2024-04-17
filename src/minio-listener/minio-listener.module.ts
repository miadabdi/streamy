import { Module } from '@nestjs/common';
import { MinioClientModule } from '../minio-client/minio-client.module';
import { VideoModule } from '../video/video.module';
import { MinioListenerService } from './minio-listener.service';

@Module({
	imports: [MinioClientModule, VideoModule],
	providers: [MinioListenerService],
})
export class MinioListenerModule {}
