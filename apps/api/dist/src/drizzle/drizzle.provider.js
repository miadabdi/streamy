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
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.DrizzleAsyncProvider = void 0;
exports.createDbConnection = createDbConnection;
const config_1 = require('@nestjs/config');
const dotenv_1 = __importDefault(require('dotenv'));
const node_postgres_1 = require('drizzle-orm/node-postgres');
const path_1 = require('path');
const pg_1 = require('pg');
const schema = __importStar(require('./schema'));
dotenv_1.default.config({
	path: (0, path_1.join)(__dirname, '../../app.env'),
});
exports.DrizzleAsyncProvider = 'drizzleProvider';
exports.default = [
	{
		provide: exports.DrizzleAsyncProvider,
		inject: [config_1.ConfigService],
		useFactory: (configService) => {
			const pool = new pg_1.Pool({
				connectionString: configService.get('DATABASE_URL'),
			});
			const db = (0, node_postgres_1.drizzle)(pool, { schema, logger: true });
			return db;
		},
		exports: [exports.DrizzleAsyncProvider],
	},
];
function createDbConnection(config = {}) {
	const pool = new pg_1.Pool({
		connectionString: process.env.DATABASE_URL,
		...config,
	});
	const db = (0, node_postgres_1.drizzle)(pool, { schema });
	return { db, pool };
}
//# sourceMappingURL=drizzle.provider.js.map
