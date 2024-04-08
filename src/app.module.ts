import { Module } from '@nestjs/common';
import { ConfigModuleSetup } from './externalModules';

@Module({
	imports: [ConfigModuleSetup],
	controllers: [],
	providers: [],
})
export class AppModule {}
