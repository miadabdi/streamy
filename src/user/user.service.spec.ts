import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { UserService } from './user.service';

describe('UserService admin management', () => {
	let service: UserService;
	let usersFindFirst: jest.Mock;
	let updateExecute: jest.Mock;
	let updateReturning: jest.Mock;
	let configGet: jest.Mock;

	const updateChain = () => ({
		set: jest.fn().mockReturnValue({
			where: jest.fn().mockReturnValue({
				returning: jest.fn().mockReturnValue({ execute: updateReturning }),
				execute: updateExecute,
			}),
		}),
	});

	beforeEach(async () => {
		usersFindFirst = jest.fn();
		updateExecute = jest.fn().mockResolvedValue(undefined);
		updateReturning = jest.fn().mockResolvedValue([{ email: 'admin@x.test' }]);
		configGet = jest.fn().mockReturnValue('');

		const update = jest.fn().mockReturnValue(updateChain());

		const moduleRef = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: DrizzleService,
					useValue: {
						db: { query: { users: { findFirst: usersFindFirst } }, update },
					},
				},
				{ provide: ChannelService, useValue: {} },
				{ provide: ConfigService, useValue: { get: configGet } },
			],
		}).compile();
		service = moduleRef.get(UserService);
	});

	it('does nothing at boot when ADMIN_EMAILS is empty', async () => {
		configGet.mockReturnValue('');

		await service.onModuleInit();

		expect(updateReturning).not.toHaveBeenCalled();
	});

	it('promotes the emails listed in ADMIN_EMAILS at boot', async () => {
		configGet.mockReturnValue('a@x.test, b@x.test');

		await service.onModuleInit();

		expect(updateReturning).toHaveBeenCalledTimes(1);
	});

	it('promotes an existing user by email', async () => {
		usersFindFirst.mockResolvedValue({ id: 7, email: 'new@x.test' });

		const result = await service.promoteUser('new@x.test');

		expect(result.message).toContain('promoted');
		expect(updateExecute).toHaveBeenCalledTimes(1);
	});

	it('rejects promotion of an unknown email', async () => {
		usersFindFirst.mockResolvedValue(undefined);

		await expect(service.promoteUser('ghost@x.test')).rejects.toThrow(NotFoundException);
	});
});
