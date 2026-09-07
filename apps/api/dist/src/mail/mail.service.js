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
var MailService_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.MailService = void 0;
const mailer_1 = require('@nestjs-modules/mailer');
const common_1 = require('@nestjs/common');
const consumer_service_1 = require('../queue/consumer.service');
const producer_service_1 = require('../queue/producer.service');
let MailService = (MailService_1 = class MailService {
	constructor(mailerService, producerService, consumerService) {
		this.mailerService = mailerService;
		this.producerService = producerService;
		this.consumerService = consumerService;
		this.logger = new common_1.Logger(MailService_1.name);
	}
	onModuleInit() {
		this.consumerService.listenOnQueue('q.email.send', this.consumeEmailSendMsg.bind(this));
	}
	async consumeEmailSendMsg(content) {
		console.log(`About to call email send to, ${content.to}`);
		await this.mailerService.sendMail({ ...content });
	}
	async sendEmailRMQMsg(sendEmailMsg) {
		await this.producerService.addToQueue('q.email.send', sendEmailMsg);
	}
	sendWithTemp(to, subject, template, context) {
		this.logger.log(`Sending mail to ${to}`);
		return this.mailerService.sendMail({
			to,
			subject,
			template: __dirname + `/${template}`,
			context,
		});
	}
	sendHtml(to, subject, html) {
		this.logger.log(`Sending mail to ${to}`);
		return this.mailerService.sendMail({
			to,
			subject,
			html,
		});
	}
	sendPlain(to, subject, message) {
		this.logger.log(`Sending mail to ${to}`);
		return this.mailerService.sendMail({
			to,
			subject,
			text: message,
		});
	}
	sendForgotPassword(to, token) {
		this.logger.log(`Sending forgot email to ${to}`);
		const subject = 'Streamy - Reset Password';
		const resetLink = `https://streamy.miad.dev/reset-password/${token}`;
		const html = `
				<h2>password reset</h2>
				<a href="${resetLink}"> Reset Password Link </a>
				Reset Token: ${token}
		`;
		return this.sendEmailRMQMsg({
			to,
			subject,
			html,
		});
	}
	sendPasswordChanged(to, email) {
		this.logger.log(`Sending password changed email to ${to}`);
		const subject = 'Streamy - Password got changed';
		const html = `
				<h2>password for account with email ${email} got changed</h2>
		`;
		return this.sendEmailRMQMsg({
			to,
			subject,
			html,
		});
	}
});
exports.MailService = MailService;
exports.MailService =
	MailService =
	MailService_1 =
		__decorate(
			[
				(0, common_1.Injectable)(),
				__metadata('design:paramtypes', [
					mailer_1.MailerService,
					producer_service_1.ProducerService,
					consumer_service_1.ConsumerService,
				]),
			],
			MailService,
		);
//# sourceMappingURL=mail.service.js.map
