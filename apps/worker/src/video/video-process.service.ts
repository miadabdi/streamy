import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import handleProgress from '../common/helpers/handle-progress';
import ffprobeVideoInfo from '../common/services/ffprobe-video-info';
import { EncoderPlan, SOFTWARE_PLAN, detectEncoderPlan, ffmpegPath } from './encoder-plan';
import { buildLiveArgs, buildSubtitleArgs, buildVodArgs } from './ffmpeg-args';

@Injectable()
export class VideoProcessService {
	private logger = new Logger(VideoProcessService.name);
	private plan: EncoderPlan = SOFTWARE_PLAN;

	/** encoder chosen at boot, surfaced by the health endpoint */
	get activeEncoder(): EncoderPlan['name'] {
		return this.plan.name;
	}

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		this.plan = await detectEncoderPlan();
		this.logger.log(
			this.plan.hardware
				? `hardware transcoding enabled: ${this.plan.name}`
				: 'no working hardware encoder found, transcoding with libx264',
		);
	}

	async processVideo(localfilepath: string, dedicatedDir: string) {
		const info = await ffprobeVideoInfo(localfilepath);
		const videoStream = info.streams.find((stream) => stream.codec_type == 'video');
		if (!videoStream) {
			throw new Error('Video file does not contain video stream');
		}
		const nbFrames = Number(videoStream.nb_frames);

		const args = buildVodArgs(
			localfilepath,
			this.configService.get<number>('FFMPEG_THREAD_COUNT'),
			this.plan,
		);
		const niceness = this.configService.get<number>('FFMPEG_NICENESS');

		// progress is parsed from the same stderr stream that captures logs
		return this.run(args, dedicatedDir, niceness, (data) => handleProgress(data, nbFrames));
	}

	async processSubtitle(
		videoFilePath: string,
		subFilePath: string,
		dedicatedDir: string,
		langCode: string,
	) {
		const args = buildSubtitleArgs(
			videoFilePath,
			subFilePath,
			langCode,
			this.configService.get<number>('FFMPEG_THREAD_COUNT'),
		);
		const niceness = this.configService.get<number>('FFMPEG_NICENESS');

		return this.run(args, dedicatedDir, niceness);
	}

	async processLiveVideo(rtmpUrl: string, dedicatedDir: string) {
		const args = buildLiveArgs(
			rtmpUrl,
			this.configService.get<number>('FFMPEG_THREAD_COUNT'),
			this.plan,
		);
		const niceness = this.configService.get<number>('FFMPEG_LIVE_NICENESS');

		return this.run(args, dedicatedDir, niceness);
	}

	/**
	 * spawns ffmpeg under nice WITHOUT a shell: every argument is one argv
	 * entry, so paths and stream keys with spaces or metacharacters are safe
	 * @param {string[]} args argv entries after the ffmpeg path
	 * @param {string} cwd working directory for the child process
	 * @param {number} niceness nice level applied via the nice wrapper
	 * @param {(chunk: Buffer) => void} [onStderr] optional stderr tap (progress)
	 */
	private run(
		args: string[],
		cwd: string,
		niceness: number,
		onStderr?: (chunk: Buffer) => void,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const command = spawn('nice', ['-n', String(niceness), ffmpegPath, ...args], { cwd });
			let logs = '';

			command.stderr.on('data', (data) => {
				logs = logs + data;
				if (onStderr) onStderr(data);
			});

			command.stdout.on('data', () => {
				// stdout is reserved for media streams; logs go to stderr
			});

			command.on('close', (code) => {
				this.logger.log(`ffmpeg closed with code ${code}`);
				if (code == 0) {
					resolve();
				} else {
					reject({ code, logs });
				}
			});

			command.on('error', (err) => {
				reject({ code: null, logs: logs + err.message });
			});
		});
	}
}
