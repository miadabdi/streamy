'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ThrottlerModuleSetup = void 0;
const config_1 = require('@nestjs/config');
const throttler_1 = require('@nestjs/throttler');
exports.ThrottlerModuleSetup = throttler_1.ThrottlerModule.forRootAsync({
	imports: [config_1.ConfigModule],
	inject: [config_1.ConfigService],
	useFactory: (config) => {
		return {
			throttlers: [
				{
					ttl: config.get('THROTTLE_TTL') * 60,
					limit: config.get('THROTTLE_LIMIT'),
				},
			],
		};
	},
});
//# sourceMappingURL=throttle.module.js.map
