import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as hpp from 'hpp';
import { AppModule } from './app.module';
import { logger } from './winston';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger,
	});

	app.use(helmet());
	app.use(cookieParser());
	app.use(hpp());

	app.enableCors();

	await app.listen(3000);
}
bootstrap();
