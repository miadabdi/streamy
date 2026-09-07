import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX, APP_NAME } from './common/constants';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		// logger,
		bufferLogs: true,
	});

	app.useLogger(app.get(LoggerService));

	const configService = app.get(ConfigService);

	app.setGlobalPrefix(API_PREFIX);

	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: '1',
	});

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);

	const swaggerConfig = new DocumentBuilder()
		.setTitle(APP_NAME)
		.setDescription('streamy process node (ffmpeg worker) health and status api')
		.setVersion('0.1')
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup(API_PREFIX, app, document);

	const port = configService.get<number>('PORT');
	await app.listen(port);

	const bootstrapLogger = new Logger('bootstrap');

	process.on('uncaughtException', (err) => {
		bootstrapLogger.fatal(err);
		process.exit(1);
	});

	process.on('unhandledRejection', (err) => {
		bootstrapLogger.fatal(err);
		process.exit(1);
	});
}
bootstrap();
