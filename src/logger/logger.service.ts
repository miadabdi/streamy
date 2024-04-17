import { Injectable } from '@nestjs/common';
import { NestjsClsContextStorageService } from './cls';
import { logger } from './winston';

@Injectable()
export class LoggerService {
	constructor(private contextStorageService: NestjsClsContextStorageService) {}

	log(message: string, context?: string) {
		const id = this.contextStorageService.getContextId();

		logger.log(message, { context, requestId: id });
	}

	verbose(message: string, context?: string) {
		const id = this.contextStorageService.getContextId();

		logger.verbose(message, { context, requestId: id });
	}

	fatal(message: string, context?: string) {
		const id = this.contextStorageService.getContextId();

		logger.fatal(message, { context, requestId: id });
	}

	error(message: string, trace: string, context?: string) {
		const id = this.contextStorageService.getContextId();

		logger.error(message, trace, { context, requestId: id });
	}

	warn(message: string, context?: string) {
		const id = this.contextStorageService.getContextId();

		logger.warn(message, { context, requestId: id });
	}

	debug(message: string, context?: string) {
		const id = this.contextStorageService.getContextId();

		logger.debug(message, { context, requestId: id });
	}
}
