import type { VideoListItem } from '../types/api';
import { VideoCard } from './VideoCard';

export function VideoGrid({ videos }: { videos: VideoListItem[] }) {
	return (
		<div className="vgrid">
			{videos.map((video) => (
				<VideoCard key={video.id} video={video} />
			))}
		</div>
	);
}
