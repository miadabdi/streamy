'use strict';
var __decorate =
	(this && this.__decorate) ||
	function (decorators, target, key, desc) {
		var c = arguments.length,
			r =
				c < 3
					? target
					: desc === null
						? (desc = Object.getOwnPropertyDescriptor(target, key))
						: desc,
			d;
		if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
			r = Reflect.decorate(decorators, target, key, desc);
		else
			for (var i = decorators.length - 1; i >= 0; i--)
				if ((d = decorators[i]))
					r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return (c > 3 && r && Object.defineProperty(target, key, r), r);
	};
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
var VideoSearchService_1;
Object.defineProperty(exports, '__esModule', { value: true });
const common_1 = require('@nestjs/common');
const elasticsearch_1 = require('@nestjs/elasticsearch');
let VideoSearchService = (VideoSearchService_1 = class VideoSearchService {
	constructor(elasticsearchService) {
		this.elasticsearchService = elasticsearchService;
		this.logger = new common_1.Logger(VideoSearchService_1.name);
		this.index = 'videos';
	}
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
	async indexVideo(video) {
		const result = await this.elasticsearchService.index({
			index: this.index,
			id: video.id.toString(),
			document: {
				id: video.id,
				name: video.name,
				description: video.description,
			},
		});
		return result;
	}
	async deleteIndexVideo(videoId) {
		const result = await this.elasticsearchService.delete({
			index: this.index,
			id: videoId.toString(),
		});
		return result;
	}
	async search(text) {
		const { hits } = await this.elasticsearchService.search({
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
});
VideoSearchService = VideoSearchService_1 = __decorate(
	[
		(0, common_1.Injectable)(),
		__metadata('design:paramtypes', [elasticsearch_1.ElasticsearchService]),
	],
	VideoSearchService,
);
exports.default = VideoSearchService;
//# sourceMappingURL=video-search.service.js.map
