import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
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
import { LoggerModule } from './logger/logger.module';
import { SearchModule } from './search/search.module';

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
		ClsModule.forRoot({
			global: true,
			middleware: {
				mount: true,
				generateId: true,
				idGenerator: (req: Request) => req.headers['x-correlation-id'] ?? uuidv4(),
			},
		}),
		LoggerModule,
		SearchModule,
	],
	controllers: [],
})
export class AppModule {}
