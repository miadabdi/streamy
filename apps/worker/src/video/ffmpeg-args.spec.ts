import { buildLiveArgs, buildSubtitleArgs, buildVodArgs } from './ffmpeg-args';
import { EncoderPlan, SOFTWARE_PLAN, vaapiPlanFor, nvencPlan, qsvPlan } from './encoder-plan';

describe('ffmpeg argument builders', () => {
	it('builds vod args as separate argv elements without shell quoting', () => {
		const args = buildVodArgs('/tmp/v/video.mp4', 8, SOFTWARE_PLAN);

		expect(args[0]).toBe('-hide_banner');
		expect(args).toContain('/tmp/v/video.mp4');
		// the filter graph and stream map are single argv elements despite spaces
		expect(args).toContain(
			'[0:v]fps=fps=30,split=3[v1][v2][v3];[v1]scale=width=-2:height=1080[1080p];[v2]scale=width=-2:height=720[720p];[v3]scale=width=-2:height=360[360p]',
		);
		expect(args).toContain('v:0,a:0,name:1080p v:1,a:1,name:720p v:2,a:2,name:360p');
		for (const arg of args) {
			expect(arg).not.toMatch(/^['"]|['"]$/);
			expect(arg.length).toBeGreaterThan(0);
		}
	});

	it('uses the software encoder block on the software plan', () => {
		const args = buildVodArgs('v.mp4', 8, SOFTWARE_PLAN);

		expect(args).toContain('libx264');
		expect(args).toContain('veryfast');
		expect(args).not.toContain('h264_vaapi');
	});

	it('builds vaapi args with device, hwupload and the vaapi encoder', () => {
		const plan = vaapiPlanFor('/dev/dri/renderD128');
		const args = buildVodArgs('v.mp4', 8, plan);

		expect(plan.inputArgs).toEqual(['-vaapi_device', '/dev/dri/renderD128']);
		expect(args).toContain('-vaapi_device');
		expect(args).toContain('h264_vaapi');
		const graph = args[args.indexOf('-filter_complex') + 1];
		expect(graph).toContain('scale=width=-2:height=1080,format=nv12,hwupload[1080p]');
	});

	it('builds nvenc args as a drop-in codec swap', () => {
		const args = buildLiveArgs('rtmp://x', 8, nvencPlan());

		expect(args).toContain('h264_nvenc');
		expect(args).toContain('ull');
		const graph = args[args.indexOf('-filter_complex') + 1];
		expect(graph).not.toContain('hwupload');
	});

	it('builds qsv args with an nv12 conversion only', () => {
		const plan = qsvPlan();
		const args = buildVodArgs('v.mp4', 8, plan);

		expect(args).toContain('h264_qsv');
		expect(plan.filterBranchSuffix).toBe(',format=nv12');
		expect(plan.filterBranchSuffix).not.toContain('hwupload');
	});

	it('builds subtitle args with the language inside the stream map', () => {
		const args = buildSubtitleArgs('/tmp/v/video.mp4', '/tmp/v/sub.srt', 'en', 4);

		expect(args).toContain('v:0,s:0,name:en,sgroup:subtitle');
		expect(args).toContain('redundant_%v_%04d.ts');
		expect(args.filter((a) => a === '-i')).toHaveLength(2);
		// subtitles never encode video: the plan must not leak in
		expect(args).not.toContain('libx264');
	});

	it('keeps computed live bufsize values for every plan', () => {
		for (const plan of [
			SOFTWARE_PLAN,
			vaapiPlanFor('/dev/dri/renderD128'),
			nvencPlan(),
		] as EncoderPlan[]) {
			const args = buildLiveArgs('rtmp://x', 8, plan);
			expect(args).toContain('4000000');
			expect(args.join(' ')).not.toContain('2*');
			expect(args).toContain('-rw_timeout');
		}
	});

	it('places every flag value as its own element', () => {
		for (const args of [
			buildVodArgs('v.mp4', 8, SOFTWARE_PLAN),
			buildSubtitleArgs('v.mp4', 's.srt', 'en', 8),
			buildLiveArgs('rtmp://x', 8, SOFTWARE_PLAN),
		]) {
			for (const arg of args) {
				expect(arg.trim()).toBe(arg);
				// no flag glued into another token (run-together shell words)
				expect(arg).not.toMatch(/\s-/);
			}
			// thread count arrives as its own element
			expect(args).toContain('8');
		}
	});
});
