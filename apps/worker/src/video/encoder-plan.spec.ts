import * as childProcess from 'child_process';
import { detectEncoderPlan, SOFTWARE_PLAN } from './encoder-plan';

vi.mock('child_process', () => ({
	execFile: vi.fn(),
}));

const execFile = childProcess.execFile as unknown as vi.Mock;

const okProbe = (_c: string, args: string[], _o: unknown, cb: (e: Error | null) => void) =>
	cb(args.includes('h264_vaapi') ? null : new Error('no hw'));
const failProbe = (_c: string, _a: string[], _o: unknown, cb: (e: Error | null) => void) =>
	cb(new Error('no hw'));

describe('detectEncoderPlan', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		delete process.env.FFMPEG_ENCODER;
	});

	it('picks vaapi when its probe encodes successfully', async () => {
		execFile.mockImplementation((_c, _a, _o, cb) => cb(null, '', ''));
		const plan = await detectEncoderPlan('/dev/dri/renderD128');

		expect(plan.name).toBe('h264_vaapi');
		expect(plan.hardware).toBe(true);
		expect(plan.inputArgs).toContain('/dev/dri/renderD128');
		expect(plan.filterBranchSuffix).toContain('hwupload');
	});

	it('falls back to software when every hardware probe fails', async () => {
		execFile.mockImplementation(failProbe);
		const plan = await detectEncoderPlan('/dev/dri/renderD128');

		expect(plan).toEqual(SOFTWARE_PLAN);
	});

	it('skips probing when FFMPEG_ENCODER forces software', async () => {
		process.env.FFMPEG_ENCODER = 'software';
		execFile.mockImplementation(okProbe);

		const plan = await detectEncoderPlan('/dev/dri/renderD128');

		expect(plan.name).toBe('libx264');
		expect(execFile).not.toHaveBeenCalled();
	});

	it('honours an explicit FFMPEG_ENCODER choice when it works', async () => {
		process.env.FFMPEG_ENCODER = 'h264_nvenc';
		execFile.mockImplementation(
			(_c: string, args: string[], _o: unknown, cb: (e: Error | null) => void) =>
				cb(args.includes('h264_nvenc') ? null : new Error('not this one')),
		);

		const plan = await detectEncoderPlan('/dev/dri/renderD128');

		expect(plan.name).toBe('h264_nvenc');
		expect(plan.filterBranchSuffix).toBe('');
	});

	it('falls back to software when the forced encoder is unavailable', async () => {
		process.env.FFMPEG_ENCODER = 'h264_nvenc';
		execFile.mockImplementation(failProbe);

		const plan = await detectEncoderPlan('/dev/dri/renderD128');

		expect(plan.name).toBe('libx264');
	});
});
