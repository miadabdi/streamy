import { NestjsClsContextStorageService } from './cls';
export declare class LoggerService {
	private contextStorageService;
	constructor(contextStorageService: NestjsClsContextStorageService);
	log(message: string, context?: string): void;
	verbose(message: string, context?: string): void;
	fatal(message: string, context?: string): void;
	error(message: string, trace: string, context?: string): void;
	warn(message: string, context?: string): void;
	debug(message: string, context?: string): void;
}
