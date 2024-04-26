export const RMQ_QUEUES = ['q.video.process', 'q.email.send', 'q.set.video.status'] as const;
export type RMQ_QUEUES_TYPE = (typeof RMQ_QUEUES)[number];
