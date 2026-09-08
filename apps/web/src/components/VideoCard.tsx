import { Link } from 'react-router';
import type { VideoListItem } from '../types/api';
import { Thumb } from './Thumb';

function channelInitials(name: string | null | undefined): string {
	const words = (name ?? '?')
		.split(/[^a-zA-Z0-9]+|(?<=[a-z0-9])(?=[A-Z])/)
		.filter(Boolean);
	return (
		(words.length >= 2 ? words[0][0] + words[1][0] : (name ?? '?').slice(0, 2)).toUpperCase()
	);
}

function formatDuration(totalSeconds: number): string {
	const s = totalSeconds % 60;
	const m = Math.floor(totalSeconds / 60) % 60;
	const h = Math.floor(totalSeconds / 3600);
	const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
	return h > 0 ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
}

// Live cards drop the duration and view count: the API reports neither for a
// stream in progress, so elapsed time is the honest number (video.html).
// JSON transport carries the createdAt Date as an ISO string.
function startedAgo(from: Date | string | null): string {
	const started = from != null ? new Date(from).getTime() : 0;
	const minutes = Math.max(1, Math.floor((Date.now() - started) / 60_000));
	return minutes < 60
		? `started ${minutes} min ago`
		: `started ${Math.floor(minutes / 60)} h ago`;
}

export function VideoCard({ video }: { video: VideoListItem }) {
	const live = video.type === 'live';
	const initials = channelInitials(video.channel?.name);

	return (
		<Link className="vcard" to={`/watch/${video.videoId ?? video.id}`}>
			<div className="vcard-thumb">
				<Thumb
					seed={video.videoId ?? String(video.id)}
					initials={channelInitials(video.channel?.name)}
					file={video.thumbnailFile}
				/>
				{live ? (
					<span className="vcard-flag pill pill-live">Live</span>
				) : (
					video.duration != null && (
						<span className="vcard-dur">{formatDuration(video.duration)}</span>
					)
				)}
			</div>
			<div className="vcard-row">
				<span className="avatar avatar-sm">{initials}</span>
				<div className="vcard-body">
					<span className="vcard-title">{video.name}</span>
					<div className="vcard-channel">{video.channel?.name}</div>
					<div className="vcard-meta">
						{live ? (
							<span>{startedAgo(video.createdAt)}</span>
						) : (
							<>
								<span>{(video.numberOfVisits ?? 0).toLocaleString()} views</span>
								<span className="sep">·</span>
								<span>{(video.numberOfLikes ?? 0).toLocaleString()} likes</span>
							</>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
