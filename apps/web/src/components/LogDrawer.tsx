import { timeAgo } from '../lib/format';
import type { VideoListItem } from '../types/api';

// ffmpeg writes plain stderr (video-process.service.ts accumulates it verbatim)
// so there are no levels to read — lines are classified by shape, the text
// itself is never edited. Classes follow Nocturne components/ops.html markup.
function lineClass(line: string): string {
	if (/error|invalid|no such|cannot|unknown|denied/i.test(line)) return 'err';
	if (line.startsWith('[') || /failed|warning|deprecated/i.test(line)) return 'dim';
	return '';
}

export function LogDrawer({ video, onClose }: { video: VideoListItem; onClose: () => void }) {
	const raw = video.ffmpegProcessLogs ?? '';
	return (
		<section
			style={{
				borderRadius: 'var(--radius-md)',
				background: 'var(--color-raised)',
				boxShadow: 'var(--shadow-md)',
				padding: 'var(--space-4)',
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--space-3)',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
				<div>
					<div style={{ fontWeight: 600, fontSize: 13 }}>ffmpeg log — {video.name}</div>
					<div className="mono" style={{ fontSize: 10.5, color: 'var(--color-muted)' }}>
						{video.videoId ?? 'no video id'} · {video.processingStatus} · {timeAgo(video.createdAt)}
					</div>
				</div>
				<div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
					<button
						className="btn btn-secondary btn-sm"
						type="button"
						onClick={() => navigator.clipboard?.writeText(raw).catch(() => {})}
					>
						Copy log
					</button>
					<button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
			<div className="log" style={{ maxHeight: 200 }}>
				{raw === '' ? (
					<span className="dim">no worker output captured</span>
				) : (
					raw.split('\n').map((line, i) => (
						// pre-wrap keeps the layout; the trailing \n preserves line breaks
						<span key={i} className={lineClass(line) || undefined}>
							{line}
							{'\n'}
						</span>
					))
				)}
			</div>
			<p className="field-hint" style={{ margin: 0 }}>
				Raw worker output, unedited.
			</p>
		</section>
	);
}
