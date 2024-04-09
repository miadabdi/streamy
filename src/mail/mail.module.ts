import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Global()
@Module({
	imports: [
		MailerModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				// transport: 'smtps://user@domain.com:pass@smtp.domain.com',
				transport: {
					host: config.get<string>('SMTP_HOST'),
					port: config.get<number>('SMTP_PORT'),
					secure: false, // true for 465, false for other ports
					ignoreTLS: true,
					auth: {
						user: config.get<string>('SMTP_USERNAME'),
						pass: config.get<string>('SMTP_PASSWORD'),
					},
				},
				defaults: {
					from: config.get<string>('SMTP_FROM'),
				},
				template: {
					dir: __dirname + '/templates',
					adapter: new EjsAdapter(),
					options: {
						strict: true,
					},
				},
			}),
		}),
	],
	providers: [MailService],
	controllers: [],
	exports: [MailService],
})
export class MailModule {}
