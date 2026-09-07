import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { JwtStrategy } from './strategy/jwt.strategy';

describe('JwtStrategy validate', () => {
	let strategy: JwtStrategy;
	let usersFindFirst: ReturnType<typeof vi.fn>;

	const build = async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [
				JwtStrategy,
				{ provide: ConfigService, useValue: { get: () => 'secret' } },
				{
					provide: DrizzleService,
					useValue: { db: { query: { users: { findFirst: usersFindFirst } } } },
				},
			],
		}).compile();
		return moduleRef.get(JwtStrategy);
	};

	beforeEach(() => {
		usersFindFirst = vi.fn();
	});

	it('rejects a token issued before the last password change', async () => {
		usersFindFirst.mockResolvedValue({
			id: 1,
			passwordChangedAt: new Date('2026-09-08T12:00:00Z'),
		});
		strategy = await build();

		await expect(
			strategy.validate({
				userId: 1,
				email: 'a@x.test',
				iat: Math.floor(Date.parse('2026-09-01T00:00:00Z') / 1000),
			} as any),
		).rejects.toThrow(UnauthorizedException);
	});

	it('accepts a token issued after the last password change', async () => {
		usersFindFirst.mockResolvedValue({
			id: 1,
			passwordChangedAt: new Date('2026-09-01T00:00:00Z'),
		});
		strategy = await build();

		const user = await strategy.validate({
			userId: 1,
			email: 'a@x.test',
			iat: Math.floor(Date.parse('2026-09-08T00:00:00Z') / 1000),
		} as any);

		expect(user.id).toBe(1);
	});

	it('accepts a token when the password was never changed', async () => {
		usersFindFirst.mockResolvedValue({ id: 1, passwordChangedAt: null });
		strategy = await build();

		const user = await strategy.validate({ userId: 1, email: 'a@x.test' } as any);
		expect(user.id).toBe(1);
	});

	it('never exposes the password hash on the request user', async () => {
		usersFindFirst.mockResolvedValue({
			id: 1,
			password: 'supersecret-hash',
			passwordChangedAt: null,
		});
		strategy = await build();

		const user = await strategy.validate({ userId: 1, email: 'a@x.test' } as any);

		expect(user).not.toHaveProperty('password');
	});
});
