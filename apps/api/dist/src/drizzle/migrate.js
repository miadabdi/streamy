'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
const dotenv_1 = __importDefault(require('dotenv'));
const dotenv_expand_1 = __importDefault(require('dotenv-expand'));
const migrator_1 = require('drizzle-orm/node-postgres/migrator');
const path_1 = require('path');
const drizzle_provider_1 = require('./drizzle.provider');
const envFilePath = (0, path_1.join)(__dirname, '../../.env');
dotenv_expand_1.default.expand(
	dotenv_1.default.config({
		path: envFilePath,
	}),
);
const { pool, db } = (0, drizzle_provider_1.createDbConnection)({ max: 1 });
async function migrateDB() {
	await (0, migrator_1.migrate)(db, { migrationsFolder: './drizzle' });
	await pool.end();
}
migrateDB();
//# sourceMappingURL=migrate.js.map
