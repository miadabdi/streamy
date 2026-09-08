// Small display formatters shared by cards, the watch page and comments.

export function channelInitials(name: string | null | undefined): string {
	const words = (name ?? '?').split(/[^a-zA-Z0-9]+|(?<=[a-z0-9])(?=[A-Z])/).filter(Boolean);
	return (words.length >= 2 ? words[0][0] + words[1][0] : (name ?? '?').slice(0, 2)).toUpperCase();
}

// JSON transport carries the createdAt Date as an ISO string.
export function startedAgo(from: Date | string | null): string {
	const started = from != null ? new Date(from).getTime() : 0;
	const minutes = Math.max(1, Math.floor((Date.now() - started) / 60_000));
	return minutes < 60 ? `started ${minutes} min ago` : `started ${Math.floor(minutes / 60)} h ago`;
}

export function timeAgo(from: Date | string | null): string {
	if (from == null) return '';
	const seconds = Math.max(0, (Date.now() - new Date(from).getTime()) / 1000);
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
	const steps: [number, Intl.RelativeTimeFormatUnit][] = [
		[60, 'second'],
		[60, 'minute'],
		[24, 'hour'],
		[7, 'day'],
		[4.345, 'week'],
		[12, 'month'],
		[Number.POSITIVE_INFINITY, 'year'],
	];
	let value = seconds;
	for (const [step, unit] of steps) {
		if (value < step) return rtf.format(-Math.round(value), unit);
		value /= step;
	}
	return '';
}
