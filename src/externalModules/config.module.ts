import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { NodeEnv } from '../common/enums';

export const ConfigModuleSetup = ConfigModule.forRoot({
	envFilePath: '.env',
	isGlobal: true,
	cache: true,
	expandVariables: true,
	validationSchema: Joi.object({
		DATABASE_URL: Joi.string().min(1).required(),
		JWT_SECRET: Joi.string().min(1).required(),
		JWT_EXPIRES_IN: Joi.number().min(1).default(90),
		NODE_ENV: Joi.string()
			.valid(...Object.values(NodeEnv))
			.required(),
		PORT: Joi.number().min(1024).default(3000),
		COOKIE_EXPIRES_IN: Joi.number().min(1).default(90),
		COMPRESSION_THRESHOLD: Joi.number().min(1024).required(),
		THROTTLE_TTL: Joi.number().min(1).default(60),
		THROTTLE_LIMIT: Joi.number().min(1).default(3600),
		SMTP_HOST: Joi.string().min(1).required(),
		SMTP_PORT: Joi.number().min(0).max(65535).required(),
		SMTP_USERNAME: Joi.string().min(1).required(),
		SMTP_PASSWORD: Joi.string().min(1).required(),
		SMTP_FROM: Joi.string().min(1).required(),
		MINIO_ENDPOINT: Joi.string().min(1).required(),
		MINIO_PORT: Joi.number().min(0).max(65535).required(),
		MINIO_ACCESS_KEY: Joi.string().min(1).required(),
		MINIO_SECRET_KEY: Joi.string().min(1).required(),
		RMQ_URL: Joi.string().min(1).required(),
		ELASTICSEARCH_NODE: Joi.string().min(1).required(),
		ELASTICSEARCH_USERNAME: Joi.string().min(1).required(),
		ELASTICSEARCH_PASSWORD: Joi.string().min(1).required(),
	}),
});
