import { Module } from '@nestjs/common';
import { ChannelModule } from '../channel/channel.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { VideoModule } from '../video/video.module';
import { TagController } from './tags.controller';
import { TagService } from './tags.service';

@Module({
	imports: [DrizzleModule, FileModule, ChannelModule, VideoModule],
	controllers: [TagController],
	providers: [TagService],
	exports: [TagService],
})
export class TagModule {}
