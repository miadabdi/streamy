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
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.SearchModule = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const elasticsearch_1 = require('@nestjs/elasticsearch');
const video_search_service_1 = __importDefault(require('./video-search.service'));
let SearchModule = class SearchModule {};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate(
	[
		(0, common_1.Module)({
			imports: [
				config_1.ConfigModule,
				elasticsearch_1.ElasticsearchModule.registerAsync({
					imports: [config_1.ConfigModule],
					useFactory: async (configService) => ({
						node: configService.get('ELASTICSEARCH_NODE'),
						auth: {
							username: configService.get('ELASTICSEARCH_USERNAME'),
							password: configService.get('ELASTICSEARCH_PASSWORD'),
						},
						tls: {
							rejectUnauthorized: false,
						},
					}),
					inject: [config_1.ConfigService],
				}),
			],
			exports: [video_search_service_1.default],
			providers: [video_search_service_1.default],
		}),
	],
	SearchModule,
);
//# sourceMappingURL=search.module.js.map
