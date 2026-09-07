import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeadLetterService } from './dead-letter.service';
import { ConsumerService } from './consumer.service';
import { ProducerService } from './producer.service';

@Module({
	imports: [ConfigModule],
	providers: [ConsumerService, ProducerService, DeadLetterService],
	exports: [ConsumerService, ProducerService, DeadLetterService],
})
export class QueueModule {}
