import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModuleSetup, ThrottlerModuleSetup } from './externalModules';
import { FileModule } from './file/file.module';
import { MinioClientModule } from './minio-client/minio-client.module';

@Module({
	imports: [
		ThrottlerModuleSetup,
		ConfigModuleSetup,
		DrizzleModule,
		AuthModule,
		MinioClientModule,
		FileModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
