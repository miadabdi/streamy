import { Module } from '@nestjs/common';
import { ChannelModule } from '../channel/channel.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
	imports: [ChannelModule],
	providers: [UserService],
	controllers: [UserController],
	exports: [UserService],
})
export class UserModule {}
