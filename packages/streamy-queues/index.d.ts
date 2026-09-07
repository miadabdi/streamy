export declare const RMQ_QUEUES: readonly [
	'q.video.process',
	'q.live.process',
	'q.email.send',
	'q.set.video.status',
];

/**
 * Allowed queue names are available as type
 */
export declare type RMQ_QUEUES_TYPE = (typeof RMQ_QUEUES)[number];

/** fanout exchange catching nacked (failed) messages from all queues */
export declare const DLX_EXCHANGE: 'dlx';

/** single dead-letter queue bound to DLX_EXCHANGE */
export declare const DEAD_LETTER_QUEUE: 'q.dead_letter';
