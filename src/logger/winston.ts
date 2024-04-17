import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import { APP_NAME } from '../common/constants';
import { nestLikeConsoleFormat } from './nest-like-console-format';

const transports = {
	console: new winston.transports.Console({
		level: 'silly',
		format: winston.format.combine(
			winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
			winston.format.ms(),
			nestLikeConsoleFormat(APP_NAME, {
				colors: true,
				prettyPrint: true,
			}),
		),
	}),
	combinedFile: new winstonDailyRotateFile({
		dirname: 'logs',
		filename: 'combined',
		extension: '.log',
		level: 'info',
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({ stack: true }),
			winston.format.splat(),
			winston.format((info) => {
				info.requestId = info.context.requestId;
				info.context = info.context.context;
				return info;
			})(),
			winston.format.json({}),
		),
	}),
	errorFile: new winstonDailyRotateFile({
		dirname: 'logs',
		filename: 'error',
		extension: '.log',
		level: 'error',
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.errors({ stack: true }),
			winston.format.splat(),
			winston.format((info) => {
				info.requestId = info.context.requestId;
				info.context = info.context.context;
				return info;
			})(),
			winston.format.json(),
		),
	}),
};

export const logger = WinstonModule.createLogger({
	exitOnError: true,
	transports: [transports.console, transports.combinedFile, transports.errorFile],
});
