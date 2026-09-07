import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { VideoModule } from '../video/video.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
	imports: [VideoModule, QueueModule],
	providers: [LiveService],
	controllers: [LiveController],
})
export class LiveModule {}
