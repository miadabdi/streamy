export enum VideoProcessingStatus {
	ready_for_upload = 'ready_for_upload',
	ready_for_processing = 'ready_for_processing',
	waiting_in_queue = 'waiting_in_queue',
	processing = 'processing',
	failed_in_processing = 'failed_in_processing',
	done = 'done',
}
