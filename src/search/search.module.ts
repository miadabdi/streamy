import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { readFileSync } from 'fs';
import { join } from 'path';
import VideoSearchService from './video-search.service';

@Module({
	imports: [
		ConfigModule,
		ElasticsearchModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				node: configService.get('ELASTICSEARCH_NODE'),
				auth: {
					username: configService.get('ELASTICSEARCH_USERNAME'),
					password: configService.get('ELASTICSEARCH_PASSWORD'),
				},
				tls: {
					ca: readFileSync(join(__dirname, '../../../es_certs/ca/ca.crt'), { encoding: 'utf-8' }),
					// ca: readFileSync(join(__dirname, '../../../es_certs/es01/es01.crt')),
					// cert: readFileSync(join(__dirname, '../../../es_certs/es01/es01.crt')),
					rejectUnauthorized: false,
				},
			}),
			inject: [ConfigService],
		}),
	],
	exports: [ElasticsearchModule],
	providers: [VideoSearchService],
})
export class SearchModule {}
