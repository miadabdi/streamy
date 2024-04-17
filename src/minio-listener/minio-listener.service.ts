import { Injectable } from '@nestjs/common';
import { BUCKETS } from '../common/constants';
import { MinioClientService } from '../minio-client/minio-client.service';
import { VideoService } from '../video/video.service';

@Injectable()
export class MinioListenerService {
	constructor(
		private minioClientService: MinioClientService,
		private videoService: VideoService,
	) {}

	async onModuleInit() {
		const client = this.minioClientService.client;

		for (const bucket of BUCKETS) {
			if (bucket.name == 'videos') {
				const listener = client.listenBucketNotification(bucket.name, '', '', [
					's3:ObjectCreated:*',
				]);

				listener.on(
					'notification',
					this.videoService.handleVideoUploadEvent.bind(this.videoService),
				);
			}
		}
	}
}
