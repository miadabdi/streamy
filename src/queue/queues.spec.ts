import { DEAD_LETTER_QUEUE, DLX_EXCHANGE, RMQ_QUEUES } from '@miadabdi/streamy-queues';

describe('@miadabdi/streamy-queues', () => {
	it('defines the four streamy queues without duplicates', () => {
		expect([...RMQ_QUEUES]).toEqual([
			'q.video.process',
			'q.live.process',
			'q.email.send',
			'q.set.video.status',
		]);
		expect(new Set(RMQ_QUEUES).size).toBe(RMQ_QUEUES.length);
	});

	it('defines the dead-letter exchange and queue', () => {
		expect(DLX_EXCHANGE).toBe('dlx');
		expect(DEAD_LETTER_QUEUE).toBe('q.dead_letter');
	});
});
