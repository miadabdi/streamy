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
exports.db = exports.TEST_DATABASE_URL = void 0;
exports.ensureMigrated = ensureMigrated;
exports.resetDb = resetDb;
exports.closeDb = closeDb;
const migrator_1 = require('drizzle-orm/node-postgres/migrator');
const node_postgres_1 = require('drizzle-orm/node-postgres');
const fs_1 = require('fs');
const pg_1 = require('pg');
const schema = __importStar(require('../drizzle/schema'));
const env = Object.fromEntries(
	(0, fs_1.readFileSync)('.env', 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trim().startsWith('#'))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const expand = (value) => value.replace(/\$\{(\w+)\}/g, (_, name) => env[name] ?? '');
exports.TEST_DATABASE_URL =
	expand(env.DATABASE_TEST_URL) ?? 'postgresql://postgres:postgres@localhost:5431/streamy';
const pool = new pg_1.Pool({ connectionString: exports.TEST_DATABASE_URL, max: 5 });
exports.db = (0, node_postgres_1.drizzle)(pool, { schema });
let migrated;
function ensureMigrated() {
	migrated ??= (0, migrator_1.migrate)(exports.db, { migrationsFolder: './drizzle' });
	return migrated;
}
async function resetDb() {
	await pool.query(
		`TRUNCATE TABLE comments, tags_videos, tags, playlists_videos, playlists, subtitles, videos, subscriptions, files, channels, users RESTART IDENTITY CASCADE`,
	);
}
async function closeDb() {
	await pool.end();
}
//# sourceMappingURL=db.js.map
