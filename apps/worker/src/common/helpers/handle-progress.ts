export default function handleProgress(progressLineBuffer: Buffer, nbFrames: number): number {
	// Remove all spaces after = and trim.
	// each progress part is a key-value pai. ex: "frame=123", "time=01:23:45.67"

	const progressLine = progressLineBuffer.toString();

	const progressParts: string[] = progressLine.replace(/=\s+/g, '=').trim().split(' ');

	// build progress object
	const progress: Record<string, string | number> = {};
	for (const keyValuePair of progressParts) {
		const [key, value] = keyValuePair.split('=', 2);
		if (typeof value === 'undefined') return null;
		const valueAsNumber = +value;
		progress[key] = !Number.isNaN(valueAsNumber) ? valueAsNumber : value;
	}

	// console.log('prog: ', progress);

	if (progress.frame) {
		const progressbar = (Number(progress.frame) / nbFrames) * 100;
		console.log('progressbar: ', progressbar);

		return progressbar;
	}
}
