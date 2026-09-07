'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const core_1 = require('@nestjs/core');
const swagger_1 = require('@nestjs/swagger');
const compression_1 = __importDefault(require('compression'));
const cookie_parser_1 = __importDefault(require('cookie-parser'));
const helmet_1 = __importDefault(require('helmet'));
const hpp_1 = __importDefault(require('hpp'));
const app_module_1 = require('./app.module');
const constants_1 = require('./common/constants');
const exceptions_1 = require('./common/exceptions');
const interceptors_1 = require('./common/interceptors');
const logger_service_1 = require('./logger/logger.service');
async function bootstrap() {
	const app = await core_1.NestFactory.create(app_module_1.AppModule, {
		bufferLogs: true,
	});
	app.useLogger(app.get(logger_service_1.LoggerService));
	const configService = app.get(config_1.ConfigService);
	app.use(
		(0, compression_1.default)({
			threshold: configService.get('COMPRESSION_THRESHOLD'),
		}),
	);
	app.use((0, helmet_1.default)());
	app.use((0, cookie_parser_1.default)());
	app.use((0, hpp_1.default)());
	app.enableCors({
		origin: '*',
		credentials: true,
	});
	app.setGlobalPrefix(constants_1.API_PREFIX);
	app.enableVersioning({
		type: common_1.VersioningType.URI,
		defaultVersion: '1',
	});
	app.useGlobalPipes(
		new common_1.ValidationPipe({
			transform: true,
			whitelist: true,
		}),
	);
	app.useGlobalInterceptors(
		new interceptors_1.LoggingInterceptor(),
		new interceptors_1.TimeoutInterceptor(),
	);
	const { httpAdapter } = app.get(core_1.HttpAdapterHost);
	app.useGlobalFilters(new exceptions_1.AllExceptionsFilter(httpAdapter));
	const config = new swagger_1.DocumentBuilder()
		.setTitle('Streamy Apis')
		.setDescription('Introducing all APIs of Streamy')
		.setVersion('1.0')
		.addTag('Streamy')
		.build();
	const document = swagger_1.SwaggerModule.createDocument(app, config);
	swagger_1.SwaggerModule.setup('api', app, document);
	const port = configService.get('PORT');
	await app.listen(port);
	const bootstrapLogger = new common_1.Logger('bootstrap');
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
//# sourceMappingURL=main.js.map
