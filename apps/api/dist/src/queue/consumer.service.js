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
var __metadata =
	(this && this.__metadata) ||
	function (k, v) {
		if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
			return Reflect.metadata(k, v);
	};
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
var ConsumerService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConsumerService = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const amqp_connection_manager_1 = __importDefault(require('amqp-connection-manager'));
const queues_1 = require('./queues');
let ConsumerService = (ConsumerService_1 = class ConsumerService {
	constructor(configService) {
		this.configService = configService;
		this.logger = new common_1.Logger(ConsumerService_1.name);
		this.listeners = new Map();
		const amqpConnectionString = this.configService.get('RMQ_URL');
		this.connection = amqp_connection_manager_1.default.connect([amqpConnectionString]);
		this.channelWrapper = this.connection.createChannel({
			setup: async (channel) => {
				for (const [queue, callback] of this.listeners) {
					await this.assertQueue(channel, queue);
				}
			},
		});
	}
	async listenOnQueue(queue, callback) {
		this.logger.log(`Setup consumer for queue ${queue}`);
		this.listeners.set(queue, callback);
		await this.channelWrapper.addSetup(async (channel) => {
			await this.assertQueue(channel, queue);
		});
		await this.channelWrapper.consume(
			queue,
			(message) => {
				this.handleMessage(queue, callback, message);
			},
			{
				prefetch: 10,
			},
		);
		this.logger.log(`Consumer service started and listening on ${queue} for messages`);
	}
	async assertQueue(channel, queue) {
		await channel.assertQueue(queue, {
			durable: true,
			arguments: { 'x-dead-letter-exchange': queues_1.DLX_EXCHANGE },
		});
	}
	async handleMessage(queue, callback, message) {
		if (!message) return;
		try {
			const content = JSON.parse(message.content.toString());
			this.logger.verbose(`Received message from ${queue}: ${message.content}`);
			await callback(content);
			await this.channelWrapper.ack(message);
		} catch (err) {
			this.logger.error(`Error on consuming queue ${queue}, dead-lettering message`);
			this.logger.error(err);
			await this.channelWrapper.nack(message, false, false);
		}
	}
	isConnected() {
		return this.connection?.isConnected() ?? false;
	}
});
exports.ConsumerService = ConsumerService;
exports.ConsumerService =
	ConsumerService =
	ConsumerService_1 =
		__decorate(
			[(0, common_1.Injectable)(), __metadata('design:paramtypes', [config_1.ConfigService])],
			ConsumerService,
		);
//# sourceMappingURL=consumer.service.js.map
