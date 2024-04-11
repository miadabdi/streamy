import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { FileModule } from '../file/file.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
	imports: [DrizzleModule, FileModule],
	controllers: [ChannelController],
	providers: [ChannelService],
})
export class ChannelModule {}
