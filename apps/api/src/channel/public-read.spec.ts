import { Reflector } from '@nestjs/core';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

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
