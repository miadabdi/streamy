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
const fs_1 = require('fs');
const amqplib = __importStar(require('amqplib'));
const env = Object.fromEntries(
	(0, fs_1.readFileSync)('.env', 'utf8')
		.split('\n')
		.filter((l) => l.includes('=') && !l.trim().startsWith('#'))
		.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const expand = (value) => value.replace(/\$\{(\w+)\}/g, (_, name) => env[name] ?? '');
const RMQ_URL = expand(env.RMQ_URL ?? 'amqp://localhost:5672');
async function main() {
	const connection = await amqplib.connect(RMQ_URL);
	const channel = await connection.createChannel();
	let moved = 0;
	for (;;) {
		const message = await channel.get('q.dead_letter', { noAck: false });
		if (!message) break;
		const deaths = message.properties.headers?.['x-death'];
		const originalQueue = deaths?.[0]?.queue;
		if (!originalQueue) {
			console.warn('  skipping message without x-death header (publish nowhere to return it to)');
			channel.ack(message);
			continue;
		}
		const expired = deaths?.[0]?.['original-expiration'] != null;
		if (expired) delete message.properties.expiration;
		channel.publish('', originalQueue, message.content, {
			persistent: true,
			headers: { 'x-requeued-from-dead-letter': new Date().toISOString() },
		});
		channel.ack(message);
		moved++;
		console.log(`  requeued -> ${originalQueue}`);
	}
	console.log(`done: ${moved} message(s) requeued`);
	await channel.close();
	await connection.close();
}
main().catch((err) => {
	console.error('requeue failed:', err.message);
	process.exit(1);
});
//# sourceMappingURL=requeue-dead-letter.js.map
