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
Object.defineProperty(exports, '__esModule', { value: true });
exports.MailModule = void 0;
const mailer_1 = require('@nestjs-modules/mailer');
const ejs_adapter_1 = require('@nestjs-modules/mailer/adapters/ejs.adapter');
const common_1 = require('@nestjs/common');
const config_1 = require('@nestjs/config');
const queue_module_1 = require('../queue/queue.module');
const mail_service_1 = require('./mail.service');
let MailModule = class MailModule {};
exports.MailModule = MailModule;
exports.MailModule = MailModule = __decorate(
	[
		(0, common_1.Global)(),
		(0, common_1.Module)({
			imports: [
				mailer_1.MailerModule.forRootAsync({
					imports: [config_1.ConfigModule],
					inject: [config_1.ConfigService],
					useFactory: (config) => ({
						transport: {
							host: config.get('SMTP_HOST'),
							port: config.get('SMTP_PORT'),
							secure: false,
							ignoreTLS: true,
							auth: {
								user: config.get('SMTP_USERNAME'),
								pass: config.get('SMTP_PASSWORD'),
							},
						},
						defaults: {
							from: config.get('SMTP_FROM'),
						},
						template: {
							dir: __dirname + '/templates',
							adapter: new ejs_adapter_1.EjsAdapter(),
							options: {
								strict: true,
							},
						},
					}),
				}),
				queue_module_1.QueueModule,
			],
			providers: [mail_service_1.MailService],
			controllers: [],
			exports: [mail_service_1.MailService],
		}),
	],
	MailModule,
);
//# sourceMappingURL=mail.module.js.map
