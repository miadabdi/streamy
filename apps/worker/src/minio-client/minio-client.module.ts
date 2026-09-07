import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from 'nestjs-minio-client';
import { MinioClientController } from './minio-client.controller';
import { MinioClientService } from './minio-client.service';

@Module({
	imports: [
		MinioModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				endPoint: configService.get<string>('MINIO_ENDPOINT'),
				port: configService.get<number>('MINIO_PORT'),
				useSSL: false, // If on localhost, keep it at false. If deployed on https, change to true
				accessKey: configService.get<string>('MINIO_ACCESS_KEY'),
				secretKey: configService.get<string>('MINIO_SECRET_KEY'),
			}),
			inject: [ConfigService],
		}),
	],
	providers: [MinioClientService],
	controllers: [MinioClientController],
	exports: [MinioClientService],
})
export class MinioClientModule {}
