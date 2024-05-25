import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OnPlayDto, OnPublishDto, OnStopDto, OnUnpublishDto } from './dto';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
	constructor(private liveService: LiveService) {}

	@HttpCode(HttpStatus.OK)
	@Post('/on_publish')
	srsOnPublish(@Body() srsOnPublishDto: OnPublishDto) {
		return this.liveService.srsOnPublish(srsOnPublishDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('/on_unpublish')
	srsOnUnpublish(@Body() srsOnUnpublishDto: OnUnpublishDto) {
		return this.liveService.srsOnUnpublish(srsOnUnpublishDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('/on_play')
	srsOnPlay(@Body() srsOnPlayDto: OnPlayDto) {
		return this.liveService.srsOnPlay(srsOnPlayDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('/on_stop')
	srsOnStop(@Body() srsOnStopDto: OnStopDto) {
		return this.liveService.srsOnStop(srsOnStopDto);
	}
}
