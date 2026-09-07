'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.logger = void 0;
const nest_winston_1 = require('nest-winston');
const winston_1 = __importDefault(require('winston'));
const winston_daily_rotate_file_1 = __importDefault(require('winston-daily-rotate-file'));
const constants_1 = require('../common/constants');
const nest_like_console_format_1 = require('./nest-like-console-format');
const stripNestContext = winston_1.default.format((info) => {
	const context = info.context;
	if (context && typeof context === 'object') {
		const { requestId, context: contextLabel } = context;
		if (requestId != null) {
			info.requestId = String(requestId);
		}
		if (typeof contextLabel === 'string') {
			info.context = contextLabel;
		} else {
			delete info.context;
		}
	} else if (context == null) {
		delete info.context;
	}
	return info;
});
const transports = {
	console: new winston_1.default.transports.Console({
		level: 'silly',
		format: winston_1.default.format.combine(
			winston_1.default.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
			winston_1.default.format.ms(),
			(0, nest_like_console_format_1.nestLikeConsoleFormat)(constants_1.APP_NAME, {
				colors: true,
				prettyPrint: true,
			}),
		),
	}),
	combinedFile: new winston_daily_rotate_file_1.default({
		dirname: 'logs',
		filename: 'combined',
		extension: '.log',
		level: 'info',
		format: winston_1.default.format.combine(
			winston_1.default.format.timestamp(),
			winston_1.default.format.errors({ stack: true }),
			winston_1.default.format.splat(),
			stripNestContext(),
			winston_1.default.format.json({}),
		),
	}),
	errorFile: new winston_daily_rotate_file_1.default({
		dirname: 'logs',
		filename: 'error',
		extension: '.log',
		level: 'error',
		format: winston_1.default.format.combine(
			winston_1.default.format.timestamp(),
			winston_1.default.format.errors({ stack: true }),
			winston_1.default.format.splat(),
			stripNestContext(),
			winston_1.default.format.json(),
		),
	}),
};
exports.logger = nest_winston_1.WinstonModule.createLogger({
	exitOnError: true,
	transports: [transports.console, transports.combinedFile, transports.errorFile],
});
//# sourceMappingURL=winston.js.map
