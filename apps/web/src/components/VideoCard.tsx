import { Link } from 'react-router';
import { channelInitials, startedAgo } from '../lib/format';
import type { VideoListItem } from '../types/api';
import { Thumb } from './Thumb';

function formatDuration(totalSeconds: number): string {
	const s = totalSeconds % 60;
	const m = Math.floor(totalSeconds / 60) % 60;
	const h = Math.floor(totalSeconds / 3600);
	const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
	return h > 0 ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
}

export function VideoCard({ video }: { video: VideoListItem }) {
	const live = video.type === 'live';
	const initials = channelInitials(video.channel?.name);

	// numeric id: the public GET /video/by-id keys on it (the string videoId
	// route was never resolvable anonymously — by-video-id is auth-gated)
	return (
		<Link className="vcard" to={`/watch/${video.id}`}>
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
