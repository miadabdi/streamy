import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
	imports: [DrizzleModule, FileModule],
	controllers: [VideoController],
	providers: [VideoService],
	exports: [VideoService],
})
export class VideoModule {}
