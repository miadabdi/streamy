import { WriteResponseBase } from '@elastic/elasticsearch/lib/api/types';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { VideoSearchBody } from './interface';
export default class VideoSearchService {
	private readonly elasticsearchService;
	private logger;
	private index;
	constructor(elasticsearchService: ElasticsearchService);
	onModuleInit(): Promise<void>;
	indexVideo(video: VideoSearchBody): Promise<WriteResponseBase>;
	deleteIndexVideo(videoId: number): Promise<WriteResponseBase>;
	search(text: string): Promise<VideoSearchBody[]>;
}
