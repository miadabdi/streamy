/**
 * shared rabbitmq queue names AND message shapes for the streamy
 * platform — these are the integration contract between the streamy api
 * and streamy_process_node; changing one requires a coordinated deploy
 * of both apps
 */

export declare const RMQ_QUEUES: readonly [
  "q.video.process",
  "q.live.process",
  "q.email.send",
  "q.set.video.status",
];

/**
 * Allowed queue names are available as type
 */
export declare type RMQ_QUEUES_TYPE = (typeof RMQ_QUEUES)[number];

/** fanout exchange catching nacked (failed) messages from all queues */
export declare const DLX_EXCHANGE: "dlx";

/** single dead-letter queue bound to DLX_EXCHANGE */
export declare const DEAD_LETTER_QUEUE: "q.dead_letter";

/** lifecycle of a video, mirrored from the api's video_proccessing_status */
export declare type VideoProcessingStatus =
  | "ready_for_upload"
  | "ready_for_processing"
  | "waiting_in_queue"
  | "processing"
  | "failed_in_processing"
  | "done";

/** a subtitle riding along a video process message */
export interface SubProcessMsg {
  id: number;
  langRFC5646: string;
  fileId: number;
  filePath: string;
  bucketName: string;
  sizeInByte: number;
  mimetype: string;
}

/** api -> process node: transcode this uploaded video */
export interface VideoProcessMsg {
  videoId: number;
  fileId: number;
  bucketName: string;
  filePath: string;
  sizeInByte: number;
  mimetype: string;
  subs: SubProcessMsg[];
}

/** api -> process node: transcode this live stream */
export interface LiveProcessMsg {
  id: number;
  videoId: string;
  app: string;
  streamKey: string;
}

/** process node -> api: video reached this status */
export interface SetVideoStatusMsg {
  videoId: number;
  status: VideoProcessingStatus;
  /** ffmpeg logs on failure */
  logs?: string;
}
