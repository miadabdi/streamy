import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { VideoSearchBody, VideoSearchResult } from './interface';

@Injectable()
export default class VideoSearchService {
	private logger = new Logger(VideoSearchService.name);
	private index = 'videos';

	constructor(private readonly elasticsearchService: ElasticsearchService) {}

	async onModuleInit() {
		const exists = await this.elasticsearchService.indices.exists({
			index: this.index,
		});

		if (exists) {
			this.logger.log(`${this.index} index exists`);
			return;
		}

		this.logger.log(`Creating ${this.index} index`);
		const createIndex = await this.elasticsearchService.indices.create({
			index: this.index,
			mappings: {
				dynamic: 'strict',
				properties: {
					name: { type: 'text', fields: { keyword: { type: 'keyword' } }, analyzer: 'english' },
					description: { type: 'text', analyzer: 'english' },
					id: { type: 'integer', coerce: false },
					channelId: { type: 'integer', coerce: false },
					duration: { type: 'float', coerce: false },
					numberOfDislikes: { type: 'integer', coerce: false },
					numberOfLikes: { type: 'integer', coerce: false },
					numberOfVisits: { type: 'integer', coerce: false },
					releasedAt: { type: 'date' },
				},
			},
			settings: {
				number_of_replicas: 0,
				number_of_shards: 4,
				auto_expand_replicas: '0-5',
			},
		});

		this.logger.log(`${this.index} index created`);
	}

	async indexVideo(video: VideoSearchBody) {
		const result = await this.elasticsearchService.index<VideoSearchBody>({
			index: this.index,
			document: {
				id: video.id,
				channelId: video.channelId,
				description: video.description,
				duration: video.duration,
				name: video.name,
				numberOfDislikes: video.numberOfDislikes,
				numberOfLikes: video.numberOfLikes,
				numberOfVisits: video.numberOfVisits,
				releasedAt: video.releasedAt,
			},
		});

		return result;
	}

	async search(text: string) {
		const { hits } = await this.elasticsearchService.search<VideoSearchResult>({
			index: this.index,
			query: {
				multi_match: {
					query: text,
					fields: ['name^2', 'description'],
					fuzziness: 'auto',
					fuzzy_transpositions: true,
				},
			},
		});
		const actualHits = hits.hits;
		return actualHits.map((item) => item._source);
	}
}
