import { OnPlayDto, OnPublishDto, OnStopDto, OnUnpublishDto } from './dto';
import { LiveService } from './live.service';
export declare class LiveController {
	private liveService;
	constructor(liveService: LiveService);
	srsOnPublish(srsOnPublishDto: OnPublishDto): Promise<{
		code: number;
	}>;
	srsOnUnpublish(srsOnUnpublishDto: OnUnpublishDto): Promise<{
		code: number;
	}>;
	srsOnPlay(srsOnPlayDto: OnPlayDto): {
		code: number;
	};
	srsOnStop(srsOnStopDto: OnStopDto): {
		code: number;
	};
}
