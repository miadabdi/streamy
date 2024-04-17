import { Module } from '@nestjs/common';
import { NestjsClsContextStorageService } from './cls';
import { LoggerService } from './logger.service';

@Module({
	providers: [LoggerService, NestjsClsContextStorageService],
	exports: [LoggerService],
})
export class LoggerModule {}
