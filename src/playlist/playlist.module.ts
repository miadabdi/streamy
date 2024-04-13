import { Module } from '@nestjs/common';
import { ChannelModule } from '../channel/channel.module';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { VideoModule } from '../video/video.module';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

@Module({
	imports: [DrizzleModule, ChannelModule, VideoModule],
	controllers: [PlaylistController],
	providers: [PlaylistService],
	exports: [PlaylistService],
})
export class PlaylistModule {}
