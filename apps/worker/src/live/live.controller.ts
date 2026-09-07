import { Controller } from '@nestjs/common';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
	constructor(private liveService: LiveService) {}
}
