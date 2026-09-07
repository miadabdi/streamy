'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
const dotenv_1 = __importDefault(require('dotenv'));
const dotenv_expand_1 = __importDefault(require('dotenv-expand'));
const path_1 = require('path');
const envFilePath = (0, path_1.join)(__dirname, '.env');
dotenv_expand_1.default.expand(
	dotenv_1.default.config({
		path: envFilePath,
	}),
);
exports.default = {
	schema: './src/drizzle/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL,
	},
};
//# sourceMappingURL=drizzle.config.js.map
