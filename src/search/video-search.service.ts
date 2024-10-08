import { WriteResponseBase } from '@elastic/elasticsearch/lib/api/types';
import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { VideoSearchBody, VideoSearchResult } from './interface';

@Injectable()
export default class VideoSearchService {
	private logger = new Logger(VideoSearchService.name);
	private index = 'videos';

	constructor(private readonly elasticsearchService: ElasticsearchService) {}

	async onModuleInit() {
		// if index does not exist, create it
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

	/**
	 * indexes a document, this method is wrote specifically for video index
	 * @param {VideoSearchBody} video
	 * @returns {WriteResponseBase}
	 */
	async indexVideo(video: VideoSearchBody): Promise<WriteResponseBase> {
		const result = await this.elasticsearchService.index<VideoSearchBody>({
			index: this.index,
			id: video.id.toString(),
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

	/**
	 * deletes an indexed document, this method is wrote specifically for video index
	 * @param {number} videoId
	 * @returns {WriteResponseBase}
	 */
	async deleteIndexVideo(videoId: number): Promise<WriteResponseBase> {
		const result = await this.elasticsearchService.delete({
			index: this.index,
			id: videoId.toString(),
		});

		return result;
	}

	/**
	 * searches in indexed video documents on name and description fields
	 * @param {string} text
	 * @returns {VideoSearchResult[]}
	 */
	async search(text: string): Promise<VideoSearchBody[]> {
		const { hits } = await this.elasticsearchService.search<VideoSearchBody>({
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
		const result = actualHits.map((item) => item._source);
		return result;
	}
}
