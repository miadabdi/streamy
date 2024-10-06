import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class AppController {
	@Get('/health-check')
	healthcheck() {
		const healthcheck = {
			uptime: process.uptime(),
			responseTime: process.hrtime(),
			message: 'OK',
			timestamp: Date.now(),
		};

		return healthcheck;
	}
}
