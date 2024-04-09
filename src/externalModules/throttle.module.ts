import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';

export const ThrottlerModuleSetup = ThrottlerModule.forRootAsync({
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: (config: ConfigService) => {
		return {
			throttlers: [
				{
					ttl: config.get<number>('THROTTLE_TTL') * 60,
					limit: config.get<number>('THROTTLE_LIMIT'),
				},
			],
		} as ThrottlerModuleOptions;
	},
});
