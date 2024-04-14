import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { VideoModule } from '../video/video.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
	imports: [DrizzleModule, VideoModule],
	controllers: [CommentController],
	providers: [CommentService],
	exports: [CommentService],
})
export class CommentModule {}
