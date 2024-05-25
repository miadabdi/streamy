import { Module } from '@nestjs/common';
import { VideoModule } from '../video/video.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
	imports: [VideoModule],
	providers: [LiveService],
	controllers: [LiveController],
})
export class LiveModule {}
