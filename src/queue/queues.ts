/**
 * Allowed queue names
 */
export const RMQ_QUEUES = ['q.video.process', 'q.email.send', 'q.set.video.status'] as const;

/**
 * Allowed queue names are available as type
 */
export type RMQ_QUEUES_TYPE = (typeof RMQ_QUEUES)[number];
