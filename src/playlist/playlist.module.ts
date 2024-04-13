import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

@Module({
	imports: [DrizzleModule, FileModule],
	controllers: [PlaylistController],
	providers: [PlaylistService],
	exports: [PlaylistService],
})
export class PlaylistModule {}
