import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class MailService {
	private logger = new Logger(MailService.name);

	constructor(private readonly mailerService: MailerService) {}

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
}
