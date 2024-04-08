import { Module } from '@nestjs/common';
import { DrizzleModule } from './drizzle/drizzle.module';
import { ConfigModuleSetup } from './externalModules';

@Module({
	imports: [ConfigModuleSetup, DrizzleModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
