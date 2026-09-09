import { LiveProcessMsg as LiveProcessMsgBase } from '@miadabdi/streamy-queues';

/**
 * api-side live process message: `resume` marks a publish that reconnected
 * inside the grace window, so the worker appends to the existing broadcast
 */
export interface LiveProcessMsg extends LiveProcessMsgBase {
	resume?: boolean;
}
