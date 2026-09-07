'use strict';
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, 'default', { enumerable: true, value: v });
			}
		: function (o, v) {
				o['default'] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== 'default') __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConfigModuleSetup = void 0;
const config_1 = require('@nestjs/config');
const Joi = __importStar(require('joi'));
const enums_1 = require('../common/enums');
exports.ConfigModuleSetup = config_1.ConfigModule.forRoot({
	envFilePath: '.env',
	isGlobal: true,
	cache: true,
	expandVariables: true,
	validationSchema: Joi.object({
		DATABASE_URL: Joi.string().min(1).required(),
		JWT_SECRET: Joi.string().min(1).required(),
		ADMIN_EMAILS: Joi.string().optional(),
		JWT_EXPIRES_IN: Joi.number().min(1).default(90),
		NODE_ENV: Joi.string()
			.valid(...Object.values(enums_1.NodeEnv))
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
		MINIO_PUBLIC_ENDPOINT: Joi.string().min(1).optional(),
		MINIO_PUBLIC_PORT: Joi.number().min(0).max(65535).optional(),
		MINIO_ACCESS_KEY: Joi.string().min(1).required(),
		MINIO_SECRET_KEY: Joi.string().min(1).required(),
		RMQ_URL: Joi.string().min(1).required(),
		ELASTICSEARCH_NODE: Joi.string().min(1).required(),
		ELASTICSEARCH_USERNAME: Joi.string().min(1).required(),
		ELASTICSEARCH_PASSWORD: Joi.string().min(1).required(),
	}),
});
//# sourceMappingURL=config.module.js.map
