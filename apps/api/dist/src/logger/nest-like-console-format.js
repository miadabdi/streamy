'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.nestLikeConsoleFormat = void 0;
const fast_safe_stringify_1 = __importDefault(require('fast-safe-stringify'));
const util_1 = require('util');
const winston_1 = require('winston');
const clc = {
	bold: (text) => `\x1B[1m${text}\x1B[0m`,
	green: (text) => `\x1B[32m${text}\x1B[39m`,
	yellow: (text) => `\x1B[33m${text}\x1B[39m`,
	red: (text) => `\x1B[31m${text}\x1B[39m`,
	magentaBright: (text) => `\x1B[95m${text}\x1B[39m`,
	cyanBright: (text) => `\x1B[96m${text}\x1B[39m`,
};
const nestLikeColorScheme = {
	log: clc.green,
	error: clc.red,
	warn: clc.yellow,
	debug: clc.magentaBright,
	verbose: clc.cyanBright,
};
const nestLikeConsoleFormat = (appName = 'NestWinston', options) =>
	winston_1.format.printf((info) => {
		const { colors = !process.env.NO_COLOR, prettyPrint = false } = options ?? {};
		const { level: rawLevel, message, context: contextValue, timestamp, ms, ...meta } = info;
		const normalizedLevel = rawLevel === 'info' ? 'log' : rawLevel;
		const { contextLabel, requestId } = extractContext(contextValue);
		const displayTimestamp = normalizeTimestamp(timestamp);
		const color =
			colors && nestLikeColorScheme[normalizedLevel]
				? nestLikeColorScheme[normalizedLevel]
				: (text) => text;
		const yellow = colors ? clc.yellow : (text) => text;
		const messageText =
			typeof message === 'string' ? message : (0, util_1.inspect)(message, { colors, depth: null });
		const formattedMeta = formatMeta(meta, { colors, prettyPrint });
		return (
			color(`[${appName}] ${String(process.pid).padEnd(6)} - `) +
			(displayTimestamp ? `${displayTimestamp} ` : '') +
			`${color(normalizedLevel.toUpperCase().padStart(7))} ` +
			(contextLabel ? `${yellow('[' + contextLabel + ']')} ` : '') +
			(requestId ? `${'[' + requestId + ']'} ` : '') +
			`${color(messageText)}` +
			(formattedMeta ? ` - ${formattedMeta}` : '') +
			(ms ? ` ${yellow(ms)}` : '')
		);
	});
exports.nestLikeConsoleFormat = nestLikeConsoleFormat;
const normalizeTimestamp = (timestamp) => {
	if (typeof timestamp === 'undefined') {
		return undefined;
	}
	try {
		return timestamp === new Date(timestamp).toISOString()
			? new Date(timestamp).toLocaleString()
			: timestamp;
	} catch {
		return timestamp;
	}
};
const extractContext = (contextValue) => {
	if (typeof contextValue === 'string') {
		return { contextLabel: contextValue };
	}
	if (contextValue && typeof contextValue === 'object') {
		const { context, requestId } = contextValue;
		return {
			contextLabel: typeof context === 'string' ? context : undefined,
			requestId: requestId != null ? String(requestId) : undefined,
		};
	}
	return {};
};
const formatMeta = (meta, { colors, prettyPrint }) => {
	if (!meta || Object.keys(meta).length === 0) {
		return '';
	}
	const stringifiedMeta = (0, fast_safe_stringify_1.default)(meta);
	if (!stringifiedMeta || stringifiedMeta === '{}' || stringifiedMeta === '[]') {
		return '';
	}
	if (!prettyPrint) {
		return stringifiedMeta;
	}
	try {
		return (0, util_1.inspect)(JSON.parse(stringifiedMeta), { colors, depth: null });
	} catch {
		return stringifiedMeta;
	}
};
//# sourceMappingURL=nest-like-console-format.js.map
