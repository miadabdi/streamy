import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as amqpNS from 'amqp-connection-manager';
import amqp from 'amqp-connection-manager';
import { ConsumerService } from './consumer.service';

vi.mock('amqp-connection-manager', () => {
	const wrapper = {
		addSetup: vi.fn(),
		consume: vi.fn((_queue: string, handler: any) => Promise.resolve({ consumerTag: 't' })),
		ack: vi.fn(),
		nack: vi.fn(),
	};
	const connection = {
		createChannel: vi.fn(() => wrapper),
		isConnected: vi.fn().mockReturnValue(true),
	};
	return {
		__esModule: true,
		default: { connect: vi.fn(() => connection) },
		__mock: { wrapper, connection },
	};
});

const mock = (amqpNS as any).__mock;

describe('ConsumerService', () => {
	let service: ConsumerService;
	let setupFn: (channel: any) => Promise<void>;
	let assertQueue: vi.Mock;

	const consumeHandler = () => (mock.wrapper.consume as vi.Mock).mock.calls[0][1];

	beforeEach(async () => {
		vi.clearAllMocks();
		mock.connection.isConnected.mockReturnValue(true);

		const moduleRef = await Test.createTestingModule({
			providers: [
				ConsumerService,
				{ provide: ConfigService, useValue: { get: () => 'amqp://test' } },
			],
		}).compile();
		service = moduleRef.get(ConsumerService);

		const createChannel = mock.connection.createChannel as vi.Mock;
		setupFn = createChannel.mock.calls[0][0].setup;
		assertQueue = vi.fn();

		await service.listenOnQueue('q.set.video.status', async () => {});
		await setupFn({ assertQueue });
	});

	it('asserts the queue with the dead-letter exchange argument', () => {
		expect(assertQueue).toHaveBeenCalledWith('q.set.video.status', {
			durable: true,
			arguments: { 'x-dead-letter-exchange': 'dlx' },
		});
	});

	it('acks the message when the handler succeeds', async () => {
		await consumeHandler()({ content: Buffer.from('{"status":"done"}') });

		expect(mock.wrapper.ack).toHaveBeenCalledTimes(1);
		expect(mock.wrapper.nack).not.toHaveBeenCalled();
	});

	it('nacks without requeue when the handler throws', async () => {
		(mock.wrapper.consume as vi.Mock).mockClear();
		await service.listenOnQueue('q.set.video.status', async () => {
			throw new Error('boom');
		});
		const message = { content: Buffer.from('{"status":"done"}') };
		await consumeHandler()(message);

		expect(mock.wrapper.nack).toHaveBeenCalledWith(message, false, false);
		expect(mock.wrapper.ack).not.toHaveBeenCalled();
	});

	it('exposes the connection state', () => {
		expect(service.isConnected()).toBe(true);
		mock.connection.isConnected.mockReturnValue(false);
		expect(service.isConnected()).toBe(false);
	});
});
