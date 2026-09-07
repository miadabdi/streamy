import safeStringify from 'fast-safe-stringify';
import type { Format, TransformableInfo } from 'logform';
import { inspect } from 'util';
import { format } from 'winston';

const clc = {
	bold: (text: string) => `\x1B[1m${text}\x1B[0m`,
	green: (text: string) => `\x1B[32m${text}\x1B[39m`,
	yellow: (text: string) => `\x1B[33m${text}\x1B[39m`,
	red: (text: string) => `\x1B[31m${text}\x1B[39m`,
	magentaBright: (text: string) => `\x1B[95m${text}\x1B[39m`,
	cyanBright: (text: string) => `\x1B[96m${text}\x1B[39m`,
};

const nestLikeColorScheme: Record<string, (text: string) => string> = {
	log: clc.green,
	error: clc.red,
	warn: clc.yellow,
	debug: clc.magentaBright,
	verbose: clc.cyanBright,
};

type NestLikeConsoleFormatOptions = { colors?: boolean; prettyPrint?: boolean };

export const nestLikeConsoleFormat = (
	appName = 'NestWinston',
	options?: NestLikeConsoleFormatOptions,
): Format =>
	format.printf(
		(info: TransformableInfo & { context?: unknown; ms?: string; timestamp?: string }) => {
			const { colors = !process.env.NO_COLOR, prettyPrint = false } = options ?? {};
			const { level: rawLevel, message, context: contextValue, timestamp, ms, ...meta } = info;
			const normalizedLevel = rawLevel === 'info' ? 'log' : rawLevel;
			const { contextLabel, requestId } = extractContext(contextValue);
			const displayTimestamp = normalizeTimestamp(timestamp);
			const color =
				colors && nestLikeColorScheme[normalizedLevel]
					? nestLikeColorScheme[normalizedLevel]!
					: (text: string): string => text;
			const yellow = colors ? clc.yellow : (text: string): string => text;
			const messageText =
				typeof message === 'string' ? message : inspect(message, { colors, depth: null });
			const formattedMeta = formatMeta(meta as Record<string, unknown>, { colors, prettyPrint });

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
		},
	);

const normalizeTimestamp = (timestamp?: string): string | undefined => {
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

const extractContext = (contextValue: unknown): { contextLabel?: string; requestId?: string } => {
	if (typeof contextValue === 'string') {
		return { contextLabel: contextValue };
	}
	if (contextValue && typeof contextValue === 'object') {
		const { context, requestId } = contextValue as Record<string, unknown>;
		return {
			contextLabel: typeof context === 'string' ? context : undefined,
			requestId: requestId != null ? String(requestId) : undefined,
		};
	}
	return {};
};

const formatMeta = (
	meta: Record<string, unknown>,
	{ colors, prettyPrint }: { colors: boolean; prettyPrint: boolean },
): string => {
	if (!meta || Object.keys(meta).length === 0) {
		return '';
	}
	const stringifiedMeta = safeStringify(meta);
	if (!stringifiedMeta || stringifiedMeta === '{}' || stringifiedMeta === '[]') {
		return '';
	}
	if (!prettyPrint) {
		return stringifiedMeta;
	}
	try {
		return inspect(JSON.parse(stringifiedMeta), { colors, depth: null });
	} catch {
		return stringifiedMeta;
	}
};
