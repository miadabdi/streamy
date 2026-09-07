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
var ProducerService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.ProducerService = void 0;
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const amqp_connection_manager_1 = __importDefault(require('amqp-connection-manager'));
const queues_1 = require('./queues');
let ProducerService = (ProducerService_1 = class ProducerService {
	constructor(configService) {
		this.configService = configService;
		this.logger = new common_1.Logger(ProducerService_1.name);
		const amqpConnectionString = this.configService.get('RMQ_URL');
		const connection = amqp_connection_manager_1.default.connect([amqpConnectionString]);
		this.channelWrapper = connection.createChannel({
			setup: async (channel) => {
				await channel.assertExchange(queues_1.DLX_EXCHANGE, 'fanout', { durable: true });
				await channel.assertQueue(queues_1.DEAD_LETTER_QUEUE, { durable: true });
				await channel.bindQueue(queues_1.DEAD_LETTER_QUEUE, queues_1.DLX_EXCHANGE, '');
				for (const queue of queues_1.RMQ_QUEUES) {
					this.logger.log(`Asserting queue ${queue}`);
					await channel.assertQueue(queue, {
						durable: true,
						arguments: { 'x-dead-letter-exchange': queues_1.DLX_EXCHANGE },
					});
				}
			},
		});
	}
	async addToQueue(queue, payload) {
		try {
			await this.channelWrapper.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
				persistent: true,
			});
			this.logger.log('Sent To Queue');
		} catch (error) {
			this.logger.error(error);
			throw new common_1.InternalServerErrorException(`Error adding to ${queue} queue`);
		}
	}
});
exports.ProducerService = ProducerService;
exports.ProducerService =
	ProducerService =
	ProducerService_1 =
		__decorate(
			[(0, common_1.Injectable)(), __metadata('design:paramtypes', [config_1.ConfigService])],
			ProducerService,
		);
//# sourceMappingURL=producer.service.js.map
