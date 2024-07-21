import { forwardRef, Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
	imports: [DrizzleModule, FileModule, forwardRef(() => PlaylistModule)],
	controllers: [ChannelController],
	providers: [ChannelService],
	exports: [ChannelService],
})
export class ChannelModule {}
