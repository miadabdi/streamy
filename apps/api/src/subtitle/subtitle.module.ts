import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { VideoModule } from '../video/video.module';
import { SubtitleController } from './subtitle.controller';
import { SubtitleService } from './subtitle.service';

@Module({
	imports: [DrizzleModule, FileModule, VideoModule],
	controllers: [SubtitleController],
	providers: [SubtitleService],
	exports: [SubtitleService],
})
export class SubtitleModule {}
