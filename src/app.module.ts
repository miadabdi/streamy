import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChannelModule } from './channel/channel.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModuleSetup, ThrottlerModuleSetup } from './externalModules';
import { FileModule } from './file/file.module';
import { MailModule } from './mail/mail.module';
import { MinioClientModule } from './minio-client/minio-client.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';

@Module({
	imports: [
		ThrottlerModuleSetup,
		ConfigModuleSetup,
		DrizzleModule,
		AuthModule,
		MinioClientModule,
		FileModule,
		UserModule,
		MailModule,
		ChannelModule,
		VideoModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
