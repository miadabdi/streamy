import type { CSSProperties } from 'react';
import { storageBase } from '../lib/env';
import type { ApiFile } from '../types/api';

// Thumbnails are an optional upload, so the fallback is the default state, not
// an error state (Nocturne components/video.html): a two-stop oklch ground
// seeded from a stable hash of the video ID, carrying the channel initials.
function hueSeed(seed: string): number {
	let hue = 0;
	for (let i = 0; i < seed.length; i++) {
		hue = (hue * 31 + seed.charCodeAt(i)) % 360;
	}
	return hue;
}

export function Thumb({
	seed,
	initials,
	file,
}: {
	seed: string;
	initials: string;
	file: ApiFile | null;
}) {
	if (file) {
		return (
			<img src={`${storageBase()}/${file.bucketName}/${file.path}`} alt="" loading="lazy" />
		);
	}
	return (
		<div className="vcard-fallback" style={{ '--seed': hueSeed(seed) } as CSSProperties}>
			<span>{initials}</span>
		</div>
	);
}
