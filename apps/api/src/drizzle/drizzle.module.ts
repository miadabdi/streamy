import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import drizzleProvider from './drizzle.provider';
import { DrizzleService } from './drizzle.service';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [...drizzleProvider, DrizzleService],
	exports: [DrizzleService],
})
export class DrizzleModule {}
