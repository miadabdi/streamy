import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { MailService } from '../mail/mail.service';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto';

describe('AuthService', () => {
	let authService: AuthService;

	const fakeDrizzleService: Partial<DrizzleService> = {
		db: {
			query: {
				users: {
					findFirst: jest.fn(),
				},
			},
			transaction: jest.fn(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn().mockReturnThis(),
			execute: jest.fn(),
		},
	};

	const fakeChannelService: Partial<ChannelService> = {
		createChannel: jest.fn(),
	};

	const fakeUserService: Partial<UserService> = {
		setCurrentChannel: jest.fn(),
		getMe: jest.fn(),
	};

	const fakeMailService: Partial<MailService> = {
		sendEmailRMQMsg: jest.fn(),
	};

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: JwtService,
					useValue: { signAsync: jest.fn() },
				},
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string) => {
							switch (key) {
								case 'JWT_SECRET':
									return 'testSecret';
								case 'JWT_EXPIRES_IN':
									return '1';
								case 'COOKIE_EXPIRES_IN':
									return 1;
								default:
									return null;
							}
						}),
					},
				},
				{
					provide: DrizzleService,
					useValue: fakeDrizzleService,
				},
				{
					provide: MailService,
					useValue: fakeMailService,
				},
				{
					provide: UserService,
					useValue: fakeUserService,
				},
				{
					provide: ChannelService,
					useValue: fakeChannelService,
				},
			],
		}).compile();

		authService = moduleRef.get<AuthService>(AuthService);
	});

	it('should be defined', () => {
		expect(authService).toBeDefined();
	});

	describe('signUp', () => {
		it('should throw ConflictException if email is already taken', async () => {
			const signUpDto: SignUpDto = {
				email: 'mail@example.com',
				password: 'password',
				channel: {
					username: 'username',
					name: 'name',
					description: 'desc',
				},
			};

			jest.spyOn(fakeDrizzleService.db.query.users, 'findFirst').mockResolvedValueOnce({
				id: 1,
				email: signUpDto.email,
			});

			await expect(authService.signUp(signUpDto)).rejects.toThrow(ConflictException);
		});

		it('should create a new user and channel', async () => {
			const signUpDto: SignUpDto = {
				email: 'mail@example.com',
				password: 'password',
				channel: {
					username: 'username',
					name: 'name',
					description: 'desc',
				},
			};

			jest.spyOn(fakeDrizzleService.db.query.users, 'findFirst').mockResolvedValueOnce(null);
			jest.spyOn(authService, 'hash').mockResolvedValueOnce('hashedPassword');
			jest.spyOn(fakeDrizzleService.db, 'transaction').mockImplementation(async (cb) => {
				const tx = {
					insert: jest.fn().mockReturnThis(),
					values: jest.fn().mockReturnThis(),
					returning: jest.fn().mockReturnThis(),
					execute: jest.fn().mockResolvedValue([{ id: 1, email: signUpDto.email }]),
				};
				await cb(tx);
			});
			jest.spyOn(fakeChannelService, 'createChannel').mockResolvedValueOnce({ id: 1 });
			jest.spyOn(fakeUserService, 'setCurrentChannel').mockResolvedValueOnce(undefined);
			jest.spyOn(fakeUserService, 'getMe').mockResolvedValueOnce({
				id: 1,
				email: signUpDto.email,
			});

			const user = await authService.signUp(signUpDto);

			expect(user).toEqual({
				id: 1,
				email: signUpDto.email,
			});
			expect(fakeDrizzleService.db.query.users.findFirst).toHaveBeenCalledWith({
				where: eq(expect.any(Object), signUpDto.email),
			});
			expect(authService.hash).toHaveBeenCalledWith(signUpDto.password);
			expect(fakeChannelService.createChannel).toHaveBeenCalledWith(
				signUpDto.channel,
				expect.any(Object),
				expect.any(Object),
			);
			expect(fakeUserService.setCurrentChannel).toHaveBeenCalledWith(
				{ currentChannelId: 1 },
				expect.any(Object),
				expect.any(Object),
			);
			expect(fakeUserService.getMe).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
		});
	});
});
