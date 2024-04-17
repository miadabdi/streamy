import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChannelModule } from './channel/channel.module';
import { CommentModule } from './comment/comment.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModuleSetup, ThrottlerModuleSetup } from './externalModules';
import { FileModule } from './file/file.module';
import { MailModule } from './mail/mail.module';
import { MinioClientModule } from './minio-client/minio-client.module';
import { MinioListenerModule } from './minio-listener/minio-listener.module';
import { PlaylistModule } from './playlist/playlist.module';
import { QueueModule } from './queue/queue.module';
import { SubtitleModule } from './subtitle/subtitle.module';
import { TagModule } from './tag/tags.module';
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
		SubtitleModule,
		PlaylistModule,
		TagModule,
		CommentModule,
		MinioListenerModule,
		QueueModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
