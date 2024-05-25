import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoService } from '../video/video.service';
import { OnPlayDto, OnPublishDto, OnStopDto, OnUnpublishDto } from './dto';

@Injectable()
export class LiveService {
	private logger = new Logger(LiveService.name);

	constructor(
		private configService: ConfigService,
		private videoService: VideoService,
	) {}

	async srsOnPublish(srsOnPublishDto: OnPublishDto) {
		if (srsOnPublishDto.app != 'live') {
			throw new ForbiddenException('Only live app is allowed');
		}

		const data = await this.videoService.getLiveByVideoId(srsOnPublishDto.stream);

		if (data) {
			return { code: 0 };
		} else {
			return new NotFoundException('Key not found');
		}
	}

	srsOnUnpublish(srsOnUnpublishDto: OnUnpublishDto) {
		console.dir(srsOnUnpublishDto, { depth: null });
		return { code: 0 };
	}

	srsOnPlay(srsOnPlayDto: OnPlayDto) {
		console.dir(srsOnPlayDto, { depth: null });
		return { code: 0 };
	}

	srsOnStop(srsOnStopDto: OnStopDto) {
		console.dir(srsOnStopDto, { depth: null });
		return { code: 0 };
	}
}
