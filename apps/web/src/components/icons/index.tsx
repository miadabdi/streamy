import type { SVGProps } from 'react';

// Source of truth: Nocturne/foundations/brand.html — 24px grid, currentColor, 1.75px strokes,
// square joins (SVG default miter), only play filled. Transcribe, never redraw.

type IconProps = SVGProps<SVGSVGElement>;

export function PlayIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
			<polygon points="9,6 19,12 9,18" />
		</svg>
	);
}

export function LiveIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
			<path d="M6.5 6.5a7.8 7.8 0 0 0 0 11M17.5 6.5a7.8 7.8 0 0 1 0 11" />
		</svg>
	);
}

export function VodIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<rect x="3" y="5" width="18" height="14" rx="1.5" />
			<path d="M3 9.5h18M3 14.5h18M8 5v14M16 5v14" />
		</svg>
	);
}

export function UploadIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M12 4v11M7.5 8.5 12 4l4.5 4.5M4 20h16" />
		</svg>
	);
}

export function ReleaseIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M12 15V4M8 7.5 12 4l4 3.5M4 14v6h16v-6" />
		</svg>
	);
}

export function QueueIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M4 7h11M4 12h11M4 17h7" />
			<circle cx="19" cy="17" r="2" />
		</svg>
	);
}

export function ProcessingIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M20 12a8 8 0 1 0-3.2 6.4" />
		</svg>
	);
}

export function EncoderIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<rect x="6" y="6" width="12" height="12" rx="1" />
			<path d="M9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3" />
		</svg>
	);
}

export function StorageIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<rect x="3" y="4.5" width="18" height="4.5" rx="1" />
			<rect x="3" y="10.5" width="18" height="4.5" rx="1" />
			<rect x="3" y="16.5" width="18" height="3" rx="1" />
		</svg>
	);
}

export function StreamKeyIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<circle cx="8" cy="12" r="3.5" />
			<path d="M11.5 12H21M18 12v3.5M15 12v2.5" />
		</svg>
	);
}

export function ElapsedIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<circle cx="12" cy="12" r="8" />
			<path d="M12 7.5V12l3.5 2" />
		</svg>
	);
}

export function SubtitleIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<rect x="3" y="5" width="18" height="14" rx="1.5" />
			<path d="M10.5 10.5a2.5 2.5 0 1 0 0 3M17.5 10.5a2.5 2.5 0 1 0 0 3" />
		</svg>
	);
}

export function QualityIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M6 18v-4M11 18v-8M16 18v-11" />
		</svg>
	);
}

export function TagIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M4 11.5 11.5 4H20v8.5L12.5 20z" />
			<circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function ChannelIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<circle cx="12" cy="9" r="3.5" />
			<path d="M5 19.5a7 7 0 0 1 14 0" />
		</svg>
	);
}

export function ViewsIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
			<circle cx="12" cy="12" r="2.5" />
		</svg>
	);
}

export function LikeIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
		</svg>
	);
}

export function CopyIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<rect x="9" y="9" width="11" height="11" rx="1.5" />
			<path d="M15 5.5H5.5V15" />
		</svg>
	);
}

export function OkIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M5 12.5 10 17.5 19.5 7" />
		</svg>
	);
}

export function FailedIcon(props: IconProps) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
			<path d="M7 7l10 10M17 7 7 17" />
		</svg>
	);
}
