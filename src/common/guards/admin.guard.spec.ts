import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
	let guard: AdminGuard;
	let usersFindFirst: vi.Mock;

	const context = (user: unknown) =>
		({
			switchToHttp: () => ({ getRequest: () => ({ user }) }),
			getClass: () => undefined,
			getHandler: () => undefined,
			getArgs: () => [],
			getType: () => 'http',
			switchToRpc: () => ({}) as any,
			switchToWs: () => ({}) as any,
		}) as unknown as ExecutionContext;

	beforeEach(async () => {
		usersFindFirst = vi.fn();

		const moduleRef = await Test.createTestingModule({
			providers: [
				AdminGuard,
				{
					provide: DrizzleService,
					useValue: { db: { query: { users: { findFirst: usersFindFirst } } } },
				},
			],
		}).compile();
		guard = moduleRef.get(AdminGuard);
	});

	it('allows when the authenticated user is an admin', async () => {
		usersFindFirst.mockResolvedValue({ id: 1, isAdmin: true });

		await expect(guard.canActivate(context({ userId: 1, email: 'a@b.c' }))).resolves.toBe(true);
		expect(usersFindFirst).toHaveBeenCalled();
	});

	it('rejects when the user is not an admin', async () => {
		usersFindFirst.mockResolvedValue({ id: 2, isAdmin: false });

		await expect(guard.canActivate(context({ userId: 2, email: 'a@b.c' }))).rejects.toThrow(
			ForbiddenException,
		);
	});

	it('rejects when there is no authenticated user', async () => {
		await expect(guard.canActivate(context(undefined))).rejects.toThrow(ForbiddenException);
	});

	it('rejects when the user no longer exists', async () => {
		usersFindFirst.mockResolvedValue(undefined);

		await expect(guard.canActivate(context({ userId: 9, email: 'a@b.c' }))).rejects.toThrow(
			ForbiddenException,
		);
	});
});
