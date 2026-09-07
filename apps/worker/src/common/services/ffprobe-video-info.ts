import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { join } from 'path';

// resolvable both under `nest start` (cwd = repo root) and `node dist/main`,
// and overridable for containers where ffprobe comes from the distro package
const ffprobePath = process.env.FFPROBE_PATH || join(process.cwd(), 'binaries', 'ffprobe');
ffmpeg.setFfprobePath(ffprobePath);

export default function ffprobeVideoInfo(filepath: string): Promise<FfprobeData> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filepath, (err: any, data: FfprobeData) => {
			if (err) {
				reject(err);
			}

			resolve(data);
		});
	});
}
