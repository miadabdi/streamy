/**
 * Allowed queue names — single source of truth lives in the shared
 * @miadabdi/streamy-queues package so the api and process node cannot drift
 */
export {
	DEAD_LETTER_QUEUE,
	DLX_EXCHANGE,
	RMQ_QUEUES,
	RMQ_QUEUES_TYPE,
} from '@miadabdi/streamy-queues';
