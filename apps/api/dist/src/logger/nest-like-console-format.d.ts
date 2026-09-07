import type { Format } from 'logform';
type NestLikeConsoleFormatOptions = {
	colors?: boolean;
	prettyPrint?: boolean;
};
export declare const nestLikeConsoleFormat: (
	appName?: string,
	options?: NestLikeConsoleFormatOptions,
) => Format;
export {};
