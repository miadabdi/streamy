import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import { SendEmailMsg } from './interface/send-email-msg.interface';
export declare class MailService {
	private readonly mailerService;
	private producerService;
	private consumerService;
	private logger;
	constructor(
		mailerService: MailerService,
		producerService: ProducerService,
		consumerService: ConsumerService,
	);
	onModuleInit(): void;
	consumeEmailSendMsg(content: SendEmailMsg): Promise<void>;
	sendEmailRMQMsg(sendEmailMsg: SendEmailMsg): Promise<void>;
	sendWithTemp(
		to: string,
		subject: string,
		template: string,
		context: object,
	): Promise<SentMessageInfo>;
	sendHtml(to: string, subject: string, html: string): Promise<SentMessageInfo>;
	sendPlain(to: string, subject: string, message: string): Promise<SentMessageInfo>;
	sendForgotPassword(to: string, token: string): Promise<void>;
	sendPasswordChanged(to: string, email: string): Promise<void>;
}
