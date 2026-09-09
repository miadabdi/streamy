import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MinioClientService } from '../minio-client/minio-client.service';
import { ConsumerService } from '../queue/consumer.service';
import { DeadLetterService } from '../queue/dead-letter.service';
import { VideoProcessService } from '../video/video-process.service';
import { VideoService } from '../video/video.service';

@ApiTags('health')
@Controller('/health')
export class HealthController {
	constructor(
		private consumerService: ConsumerService,
		private deadLetterService: DeadLetterService,
		private minioClientService: MinioClientService,
		private videoService: VideoService,
		private videoProcessService: VideoProcessService,
	) {}

	/** zero external io — must answer while rmq/storage are down */
	@ApiOkResponse({ description: 'Process is alive' })
	@Get('/liveness')
	liveness() {
		return {
			status: 'ok',
			uptime: process.uptime(),
		};
	}

	@ApiOkResponse({ description: 'Dependency, dead-letter and in-flight job state' })
	@Get('/readiness')
	async readiness() {
		return {
			rmq: this.consumerService.isConnected(),
			storage: await this.minioClientService.isAvailable(),
			deadLetters: await this.deadLetterService.count(),
			encoder: this.videoProcessService.activeEncoder,
			// oldest job (back-compat shape) + all of them for concurrent workers
			activeJob: this.videoService.activeJob,
			activeJobs: [...this.videoService.activeJobs].map(([videoId, startedAt]) => ({
				videoId,
				startedAt,
			})),
		};
	}
}
