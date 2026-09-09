import type { Video, VideoProcessingStatus } from '../types/api';

// Nocturne my-videos template: one pill per lifecycle state; Live and Released
// are additive badges that stack alongside the status pill, never replace it.
const STATUS_PILLS: Record<VideoProcessingStatus, { label: string; pill: string }> = {
	ready_for_upload: { label: 'Ready for upload', pill: 'pill-upload' },
	// queued for the worker both before and after the file lands — same warn color
	ready_for_processing: { label: 'Ready for processing', pill: 'pill-queue' },
	waiting_in_queue: { label: 'Waiting in queue', pill: 'pill-queue' },
	processing: { label: 'Processing', pill: 'pill-processing' },
	failed_in_processing: { label: 'Failed', pill: 'pill-failed' },
	done: { label: 'Done', pill: 'pill-done' },
};

export function StatusPill({ video }: { video: Pick<Video, 'processingStatus' | 'isReleased' | 'type'> }) {
	const status =
		video.processingStatus != null ? STATUS_PILLS[video.processingStatus] : null;
	return (
		<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
			{status && <span className={`pill ${status.pill}`}>{status.label}</span>}
			{video.type === 'live' && <span className="pill pill-live">Live</span>}
			{video.isReleased && <span className="pill pill-released">Released</span>}
		</div>
	);
}
