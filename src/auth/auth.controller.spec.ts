import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { CookieOptions, Response } from 'express';
import { JWT_COOKIE_NAME } from '../common/constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

class MockResponse implements Partial<Response> {
	headers = {
		'Set-Cookie': [],
	};

	cookie = jest.fn().mockImplementation((name: string, value: string, options: CookieOptions) => {
		if (!this.headers['Set-Cookie']) this.headers['Set-Cookie'] = [];

		this.headers['Set-Cookie'].push({ name, value });
	});
}

describe('AuthController', () => {
	let authController: AuthController;
	let authService: AuthService;

	beforeEach(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				ThrottlerModule.forRoot({
					throttlers: [
						{
							ttl: 60 * 60,
							limit: 10,
						},
					],
				} as ThrottlerModuleOptions),
			],
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: {},
				},
			],
		})
			.overrideProvider(ThrottlerGuard)
			.useValue({
				canActivate: jest.fn(() => true),
			})
			.compile();

		authService = moduleRef.get<AuthService>(AuthService);
		authController = moduleRef.get<AuthController>(AuthController);
	});

	describe('signout', () => {
		it('should return an empty access token', async () => {
			// const result = 'hashed';
			// jest.spyOn(authService, 'hash').mockImplementation(() => Promise.resolve(result));

			const response = new MockResponse();
			await authController.signOut(response as any);

			expect(response.headers['Set-Cookie'].length).toEqual(1);
			expect(response.headers['Set-Cookie'][0].name).toEqual(JWT_COOKIE_NAME);
			expect(response.headers['Set-Cookie'][0].value).toEqual('');
		});
	});
});
