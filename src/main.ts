import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as hpp from 'hpp';
import { AppModule } from './app.module';
import { API_PREFIX } from './common/constants';
import { logger } from './winston';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		logger,
	});

	const configService = app.get(ConfigService);

	app.use(
		compression({
			threshold: configService.get<number>('COMPRESSION_THRESHOLD'), // number in bytes
		}),
	);
	app.use(helmet());
	app.use(cookieParser());
	app.use(hpp());

	app.enableCors();

	app.setGlobalPrefix(API_PREFIX);

	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1',
	});

	const port = configService.get<number>('PORT');
	await app.listen(port);
}
bootstrap();
