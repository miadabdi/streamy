import { Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle/drizzle.module';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
	imports: [DrizzleModule],
	controllers: [ChannelController],
	providers: [ChannelService],
})
export class ChannelModule {}
