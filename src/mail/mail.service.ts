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

	/**
	 * this method is used to process consumed email messages from rabbitmq
	 * @param {SendEmailMsg} content
	 */
	async consumeEmailSendMsg(content: SendEmailMsg) {
		console.log(`About to call email send to, ${content.to}`);
		await this.mailerService.sendMail({ ...content });
	}

	/**
	 * adds a email to email queue for async processing
	 * @param {SendEmailMsg} sendEmailMsg
	 */
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

	/**
	 * sends email with html
	 * @param {string} to destination email address
	 * @param {string} subject subject of email being sent
	 * @param {string} html html for the body of the email
	 * @returns {SentMessageInfo}
	 */
	sendHtml(to: string, subject: string, html: string): Promise<SentMessageInfo> {
		this.logger.log(`Sending mail to ${to}`);

		return this.mailerService.sendMail({
			to,
			subject,
			html,
		});
	}

	/**
	 * sends plain text email
	 * @param {string} to destination email address
	 * @param {string} subject subject of email being sent
	 * @param {string} message
	 * @returns {SentMessageInfo}
	 */
	sendPlain(to: string, subject: string, message: string): Promise<SentMessageInfo> {
		this.logger.log(`Sending mail to ${to}`);

		return this.mailerService.sendMail({
			to,
			subject,
			text: message,
		});
	}

	/**
	 * sends forgot password email
	 * @param {string} to destination email address
	 * @param token forgot password token
	 * @returns {SentMessageInfo}
	 */
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

	/**
	 * sends forgot password email
	 * @param {string} to destination email address
	 * @param {string} email email of the user which its password changed
	 * @returns {SentMessageInfo}
	 */
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
