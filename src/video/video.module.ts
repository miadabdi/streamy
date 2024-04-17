import { Module } from '@nestjs/common';
import { ChannelModule } from '../channel/channel.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { QueueModule } from '../queue/queue.module';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
	imports: [DrizzleModule, FileModule, ChannelModule, QueueModule],
	controllers: [VideoController],
	providers: [VideoService],
	exports: [VideoService],
})
export class VideoModule {}
