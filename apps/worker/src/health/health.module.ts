import { Module } from '@nestjs/common';
import { MinioClientModule } from '../minio-client/minio-client.module';
import { QueueModule } from '../queue/queue.module';
import { VideoModule } from '../video/video.module';
import { HealthController } from './health.controller';

@Module({
	imports: [QueueModule, MinioClientModule, VideoModule],
	controllers: [HealthController],
})
export class HealthModule {}
