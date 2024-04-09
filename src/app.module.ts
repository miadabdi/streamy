import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModuleSetup, ThrottlerModuleSetup } from './externalModules';

@Module({
	imports: [ThrottlerModuleSetup, ConfigModuleSetup, DrizzleModule, AuthModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
