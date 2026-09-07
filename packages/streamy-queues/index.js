'use strict';

/**
 * shared rabbitmq queue names for the streamy platform — these are the
 * integration contract between the streamy api and streamy_process_node;
 * changing one requires a coordinated deploy of both apps
 */
exports.RMQ_QUEUES = [
	'q.video.process',
	'q.live.process',
	'q.email.send',
	'q.set.video.status',
];

exports.DLX_EXCHANGE = 'dlx';

exports.DEAD_LETTER_QUEUE = 'q.dead_letter';
