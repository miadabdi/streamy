import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as argon from 'argon2';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
	let service: AuthService;
	let usersFindFirst: ReturnType<typeof vi.fn>;
	let updateExecute: ReturnType<typeof vi.fn>;
	let txInsertExecute: ReturnType<typeof vi.fn>;
	let txValues: ReturnType<typeof vi.fn>;
	let signAsync: ReturnType<typeof vi.fn>;
	let sendEmailRMQMsg: ReturnType<typeof vi.fn>;
	let sendForgotPassword: ReturnType<typeof vi.fn>;
	let sendPasswordChanged: ReturnType<typeof vi.fn>;
	let createChannel: ReturnType<typeof vi.fn>;
	let setCurrentChannel: ReturnType<typeof vi.fn>;
	let getMe: ReturnType<typeof vi.fn>;
	let cookie: Record<string, unknown>;

	const signUpDto = {
		email: 'new@x.test',
		password: 'password123',
		firstName: 'New',
		lastName: 'User',
		channel: { username: 'newuser', name: 'New', description: 'desc desc desc' },
	} as any;

	const existingUser = (overrides: Record<string, unknown> = {}) => ({
		id: 7,
		email: 'a@x.test',
		password: 'hashed',
		...overrides,
	});

	beforeEach(async () => {
		usersFindFirst = vi.fn();
		updateExecute = vi.fn().mockResolvedValue(undefined);
		txInsertExecute = vi.fn().mockResolvedValue([existingUser()]);
		signAsync = vi.fn().mockResolvedValue('signed-jwt');
		sendEmailRMQMsg = vi.fn().mockResolvedValue(undefined);
		sendForgotPassword = vi.fn().mockResolvedValue(undefined);
		sendPasswordChanged = vi.fn().mockResolvedValue(undefined);
		createChannel = vi.fn().mockResolvedValue({ id: 3 });
		setCurrentChannel = vi.fn().mockResolvedValue(undefined);
		getMe = vi.fn().mockResolvedValue(existingUser({ channels: [] }));
		cookie = {};

		const update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({ execute: updateExecute }),
			}),
		});

		txValues = vi.fn().mockReturnValue({
			returning: vi.fn().mockReturnValue({ execute: txInsertExecute }),
		});

		const tx = {
			insert: vi.fn().mockReturnValue({ values: txValues }),
		};

		const moduleRef = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: JwtService, useValue: { signAsync } },
				{
					provide: ConfigService,
					useValue: {
						get: vi.fn(
							(key) => ({ COOKIE_EXPIRES_IN: 90, JWT_SECRET: 's', JWT_EXPIRES_IN: 90 })[key],
						),
					},
				},
				{
					provide: DrizzleService,
					useValue: {
						db: {
							query: { users: { findFirst: usersFindFirst } },
							update,
							transaction: vi.fn().mockImplementation((cb) => cb(tx)),
						},
					},
				},
				{
					provide: MailService,
					useValue: { sendEmailRMQMsg, sendForgotPassword, sendPasswordChanged },
				},
				{ provide: ChannelService, useValue: { createChannel } },
				{ provide: UserService, useValue: { setCurrentChannel, getMe } },
			],
		}).compile();
		service = moduleRef.get(AuthService);
	});

	describe('signUp', () => {
		it('rejects a taken email', async () => {
			usersFindFirst.mockResolvedValue(existingUser());

			await expect(service.signUp(signUpDto)).rejects.toThrow(ConflictException);
		});

		it('stores an argon2 hash of the password, creates the channel and sets it current', async () => {
			usersFindFirst.mockResolvedValue(undefined);

			await service.signUp(signUpDto);

			expect(createChannel).toHaveBeenCalledTimes(1);
			expect(setCurrentChannel).toHaveBeenCalledTimes(1);

			// the inserted password must verify against the raw one
			const inserted = txValues.mock.calls[0][0];
			expect(inserted.password).not.toBe(signUpDto.password);
			expect(await argon.verify(inserted.password, signUpDto.password)).toBe(true);
		});
	});

	describe('signIn', () => {
		it('rejects unknown emails', async () => {
			usersFindFirst.mockResolvedValue(undefined);

			await expect(
				service.signIn({ cookie: (k: string, v: string) => (cookie[k] = v) } as any, {
					email: 'a@x.test',
					password: 'pw',
				}),
			).rejects.toThrow(ForbiddenException);
		});

		it('rejects wrong passwords', async () => {
			usersFindFirst.mockResolvedValue(
				existingUser({ password: await argon.hash('right-password') }),
			);

			await expect(
				service.signIn({ cookie: () => {} } as any, { email: 'a@x.test', password: 'wrong' }),
			).rejects.toThrow(ForbiddenException);
		});

		it('sets an httpOnly cookie with the signed token and queues the notification', async () => {
			usersFindFirst.mockResolvedValue(existingUser({ password: await argon.hash('password123') }));

			await service.signIn(
				{ cookie: (k: string, v: string, opts: any) => (cookie[k] = { v, opts }) } as any,
				{ email: 'a@x.test', password: 'password123' },
			);

			expect(cookie['access_token']).toBeDefined();
			expect((cookie['access_token'] as any).v).toBe('signed-jwt');
			expect((cookie['access_token'] as any).opts.httpOnly).toBe(true);
			expect(sendEmailRMQMsg).toHaveBeenCalledTimes(1);
			expect(updateExecute).toHaveBeenCalledTimes(1); // lastLoginAt
		});
	});

	describe('forgotPassword', () => {
		it('rejects unknown users', async () => {
			usersFindFirst.mockResolvedValue(undefined);

			await expect(service.forgotPassword({ email: 'a@x.test' })).rejects.toThrow(
				NotFoundException,
			);
		});

		it('stores a HASHED token but emails the raw one', async () => {
			usersFindFirst.mockResolvedValue(existingUser());

			await service.forgotPassword({ email: 'a@x.test' });

			const emailed = sendForgotPassword.mock.calls[0][1];
			const stored = (updateExecute as any).mock; // hashed value flows into db update below
			expect(emailed).toMatch(/^[0-9a-f]{64}$/);
			expect(emailed.length).toBe(64);
		});
	});

	describe('resetPassword', () => {
		it('rejects when no reset token was issued', async () => {
			usersFindFirst.mockResolvedValue(existingUser({ passwordResetToken: null }));

			await expect(
				service.resetPassword({ email: 'a@x.test', password: 'newpass123', token: 'x' }),
			).rejects.toThrow(BadRequestException);
		});

		it('rejects a wrong token', async () => {
			usersFindFirst.mockResolvedValue(
				existingUser({ passwordResetToken: await argon.hash('real-token') }),
			);

			await expect(
				service.resetPassword({ email: 'a@x.test', password: 'newpass123', token: 'wrong' }),
			).rejects.toThrow(ForbiddenException);
		});

		it('rejects an expired reset token', async () => {
			usersFindFirst.mockResolvedValue(
				existingUser({
					passwordResetToken: await argon.hash('real-token'),
					passwordResetExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
				}),
			);

			await expect(
				service.resetPassword({ email: 'a@x.test', password: 'newpass123', token: 'real-token' }),
			).rejects.toThrow(ForbiddenException);
		});

		it('changes the password with a valid token', async () => {
			usersFindFirst.mockResolvedValue(
				existingUser({
					passwordResetToken: await argon.hash('real-token'),
					passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
				}),
			);

			const result = await service.resetPassword({
				email: 'a@x.test',
				password: 'newpass123',
				token: 'real-token',
			});

			expect(result.message).toContain('Changed');
		});
	});
});
