import { Module } from '@nestjs/common';
import { MinioClientModule } from '../minio-client/minio-client.module';
import { QueueModule } from '../queue/queue.module';
import { VideoProcessService } from './video-process.service';
import { VideoService } from './video.service';

@Module({
	imports: [QueueModule, MinioClientModule],
	controllers: [],
	providers: [VideoService, VideoProcessService],
	exports: [VideoService, VideoProcessService],
})
export class VideoModule {}
