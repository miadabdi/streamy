import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import hpp from 'hpp';
import { AppModule } from './app.module';
import { API_PREFIX } from './common/constants';
import { AllExceptionsFilter } from './common/exceptions';
import { LoggingInterceptor, TimeoutInterceptor } from './common/interceptors';
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

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);

	app.useGlobalInterceptors(new LoggingInterceptor(), new TimeoutInterceptor());

	const { httpAdapter } = app.get(HttpAdapterHost);
	app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

	const port = configService.get<number>('PORT');
	await app.listen(port);

	const config = new DocumentBuilder()
		.setTitle('Blog Apis')
		.setDescription('Introducing all APIs of blog')
		.setVersion('1.0')
		.addTag('blog')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, document);

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
