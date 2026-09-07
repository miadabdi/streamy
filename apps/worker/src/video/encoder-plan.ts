import { execFile } from 'child_process';
import { join } from 'path';

/**
 * hardware-first transcoding with graceful software fallback.
 *
 * at startup we probe candidate encoders by RUNNING a tiny real encode
 * (listing encoders only proves ffmpeg was compiled with them, not that a
 * driver/device works); the first candidate that actually encodes wins,
 * otherwise we stay on libx264. FFMPEG_ENCODER forces a choice
 * (software | h264_vaapi | h264_nvenc | h264_qsv).
 */

// resolvable both under `nest start` (cwd = repo root) and `node dist/main`,
// and overridable for containers where ffmpeg comes from the distro package
export const ffmpegPath = process.env.FFMPEG_PATH || join(process.cwd(), 'binaries', 'ffmpeg');

export type EncoderName = 'h264_vaapi' | 'h264_nvenc' | 'h264_qsv' | 'libx264';

export interface EncoderPlan {
	name: EncoderName;
	hardware: boolean;
	/** extra args placed before -i */
	inputArgs: string[];
	/** appended to every video branch of the filter graph (e.g. hwupload) */
	filterBranchSuffix: string;
	/** video codec + quality args for vod transcodes */
	vodArgs: string[];
	/** video codec + quality args for live transcodes */
	liveArgs: string[];
}

const FORCE_KEY_FRAMES = ['expr:gte(t,n_forced*2.000)'];

export const SOFTWARE_PLAN: EncoderPlan = {
	name: 'libx264',
	hardware: false,
	inputArgs: [],
	filterBranchSuffix: '',
	vodArgs: [
		'-codec:v',
		'libx264',
		'-crf:v',
		'23',
		'-profile:v',
		'high',
		'-pix_fmt:v',
		'yuv420p',
		'-rc-lookahead:v',
		'40',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
		'-preset:v',
		'veryfast',
		'-b-pyramid:v',
		'strict',
	],
	liveArgs: [
		'-codec:v',
		'libx264',
		'-crf:v',
		'23',
		'-tune:v',
		'zerolatency',
		'-pix_fmt:v',
		'yuv420p',
		'-rc-lookahead:v',
		'60',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
		'-preset:v',
		'fast',
		'-b-pyramid:v',
		'strict',
	],
};

export const vaapiPlanFor = (device: string): EncoderPlan => ({
	name: 'h264_vaapi',
	hardware: true,
	inputArgs: ['-vaapi_device', device],
	// frames must land in the hw context before the encoder; scale stays on
	// the cpu which is fine — the encode is the expensive part
	filterBranchSuffix: ',format=nv12,hwupload',
	vodArgs: [
		'-codec:v',
		'h264_vaapi',
		'-rc_mode',
		'CQP',
		'-qp:v',
		'23',
		'-profile:v',
		'high',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
	],
	liveArgs: [
		'-codec:v',
		'h264_vaapi',
		'-rc_mode',
		'CQP',
		'-qp:v',
		'23',
		'-profile:v',
		'high',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
	],
});

export const nvencPlan = (): EncoderPlan => ({
	name: 'h264_nvenc',
	hardware: true,
	inputArgs: [],
	// nvenc accepts system-memory frames; no graph change needed
	filterBranchSuffix: '',
	vodArgs: [
		'-codec:v',
		'h264_nvenc',
		'-preset:v',
		'p5',
		'-tune:v',
		'hq',
		'-rc:v',
		'vbr',
		'-cq:v',
		'23',
		'-profile:v',
		'high',
		'-pix_fmt:v',
		'nv12',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
	],
	liveArgs: [
		'-codec:v',
		'h264_nvenc',
		'-preset:v',
		'p3',
		'-tune:v',
		'ull',
		'-rc:v',
		'vbr',
		'-cq:v',
		'23',
		'-profile:v',
		'high',
		'-pix_fmt:v',
		'nv12',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
	],
});

export const qsvPlan = (): EncoderPlan => ({
	name: 'h264_qsv',
	hardware: true,
	inputArgs: [],
	// qsv uploads internally but wants nv12 frames
	filterBranchSuffix: ',format=nv12',
	vodArgs: [
		'-codec:v',
		'h264_qsv',
		'-global_quality:v',
		'23',
		'-profile:v',
		'high',
		'-preset:v',
		'veryfast',
		'-look_ahead:v',
		'0',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
	],
	liveArgs: [
		'-codec:v',
		'h264_qsv',
		'-global_quality:v',
		'23',
		'-profile:v',
		'high',
		'-preset:v',
		'veryfast',
		'-look_ahead:v',
		'0',
		'-force_key_frames:v',
		...FORCE_KEY_FRAMES,
	],
});

const PLANS: Record<Exclude<EncoderName, 'libx264'>, (device: string) => EncoderPlan> = {
	h264_vaapi: vaapiPlanFor,
	h264_nvenc: () => nvencPlan(),
	h264_qsv: () => qsvPlan(),
};

/** one real ~0.3s encode: proves device + driver + encoder all work */
function probeEncodes(ffmpeg: string, args: string[]): Promise<boolean> {
	return new Promise((resolve) => {
		execFile(
			ffmpeg,
			['-hide_banner', '-loglevel', 'error', ...args],
			{ timeout: 15000, killSignal: 'SIGKILL' },
			(err) => resolve(err == null),
		);
	});
}

function probeArgs(name: Exclude<EncoderName, 'libx264'>, device: string): string[] {
	const source = ['-f', 'lavfi', '-i', 'testsrc=duration=0.3:size=320x240:rate=10'];
	switch (name) {
		case 'h264_vaapi':
			return [
				'-vaapi_device',
				device,
				...source,
				'-vf',
				'format=nv12,hwupload',
				'-c:v',
				name,
				'-f',
				'null',
				'-',
			];
		case 'h264_nvenc':
			return [...source, '-c:v', name, '-f', 'null', '-'];
		case 'h264_qsv':
			return [...source, '-vf', 'format=nv12', '-c:v', name, '-f', 'null', '-'];
	}
}

export async function detectEncoderPlan(device = '/dev/dri/renderD128'): Promise<EncoderPlan> {
	const override = process.env.FFMPEG_ENCODER;

	if (override === 'software' || override === 'libx264') {
		return SOFTWARE_PLAN;
	}

	const candidates = (
		override
			? [override as Exclude<EncoderName, 'libx264'>]
			: (['h264_vaapi', 'h264_nvenc', 'h264_qsv'] as const)
	).filter((name) => name in PLANS);

	for (const name of candidates) {
		if (await probeEncodes(ffmpegPath, probeArgs(name, device))) {
			return PLANS[name](device);
		}
	}

	return SOFTWARE_PLAN;
}
