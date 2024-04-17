import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import { SendEmailMsg } from './interface/send-email-msg.interface';

@Injectable()
export class MailService {
	private logger = new Logger(MailService.name);

	constructor(
		private readonly mailerService: MailerService,
		private producerService: ProducerService,
		private consumerService: ConsumerService,
	) {}

	onModuleInit() {
		this.consumerService.listenOnQueue('q.email.send', this.consumeEmailSendMsg.bind(this));
	}

	async consumeEmailSendMsg(content: SendEmailMsg) {
		console.log(`About to call email send to, ${content.to}`);
		await this.mailerService.sendMail({ ...content });
	}

	async sendEmailRMQMsg(sendEmailMsg: SendEmailMsg) {
		await this.producerService.addToQueue('q.email.send', sendEmailMsg);
	}

	sendWithTemp(
		to: string,
		subject: string,
		template: string,
		context: object,
	): Promise<SentMessageInfo> {
		this.logger.log(`Sending mail to ${to}`);

		return this.mailerService.sendMail({
			to,
			subject,
			template: __dirname + `/${template}`, // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
			context,
		});
	}

	sendHtml(to: string, subject: string, html: string): Promise<SentMessageInfo> {
		this.logger.log(`Sending mail to ${to}`);

		return this.mailerService.sendMail({
			to,
			subject,
			html,
		});
	}

	sendPlain(to: string, subject: string, message: string): Promise<SentMessageInfo> {
		this.logger.log(`Sending mail to ${to}`);

		return this.mailerService.sendMail({
			to,
			subject,
			text: message,
		});
	}

	sendForgotPassword(to: string, token: string): Promise<SentMessageInfo> {
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

	sendPasswordChanged(to: string, email: string): Promise<SentMessageInfo> {
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
}
