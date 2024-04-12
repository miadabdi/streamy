import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { SubtitleController } from './subtitle.controller';
import { SubtitleService } from './subtitle.service';

@Module({
	imports: [DrizzleModule, FileModule],
	controllers: [SubtitleController],
	providers: [SubtitleService],
	exports: [SubtitleService],
})
export class SubtitleModule {}
