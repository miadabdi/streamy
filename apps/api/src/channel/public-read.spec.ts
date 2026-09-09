import { Reflector } from '@nestjs/core';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

describe('ChannelService.getChannelByUsername payload scope', () => {
	it('loads the profile without playlists or video rows and returns what the FE channel page needs', async () => {
		const findFirst = vi.fn().mockResolvedValue({
			id: 1,
			username: 'chan',
			name: 'Chan',
			description: 'desc',
			numberOfSubscribers: 3,
			avatar: { id: 5 },
		});
		const service = new ChannelService(
			{ db: { query: { channels: { findFirst } } } } as any,
			{} as any,
			{} as any,
		);

		const result = await service.getChannelByUsername('chan');

		expect(result).toEqual({
			id: 1,
			username: 'chan',
			name: 'Chan',
			description: 'desc',
			numberOfSubscribers: 3,
			avatar: { id: 5 },
		});
		expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.anything() }));
		const withRelations = findFirst.mock.calls[0][0].with;
		expect(Object.keys(withRelations)).not.toContain('playlists');
		expect(withRelations.avatar).toBe(true);
		expect(withRelations.subscriptions).toBeDefined();
	});
});

describe('ChannelController public read gating', () => {
	const reflector = new Reflector();
	const channelServiceMock = {
		getChannelByUsername: vi.fn().mockResolvedValue({ id: 1, username: 'chan' }),
	};
	const controller = new ChannelController(channelServiceMock as any);

	it('serves /by-username publicly', () => {
		expect(reflector.get('isPublic', controller.getChannelByUsername)).toBe(true);
	});

	it('delegates /by-username to the service without the requesting user', async () => {
		await controller.getChannelByUsername({ username: 'chan' } as any, { id: 7 } as any);

		expect(channelServiceMock.getChannelByUsername).toHaveBeenCalledWith('chan');
	});

	it('keeps POST / (createChannel) behind the jwt guard', () => {
		expect(reflector.get('isPublic', controller.createChannel)).toBeUndefined();
	});

	it('keeps GET /by-id behind the jwt guard', () => {
		expect(reflector.get('isPublic', controller.getChannelById)).toBeUndefined();
	});
});
