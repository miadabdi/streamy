import { Logger } from '@nestjs/common';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const UPLOADABLE_PREFIXES = ['manifest_', 'master.m3u8', 'segment_', 'sub_vtt_'];

const isUploadable = (file: string) => UPLOADABLE_PREFIXES.some((p) => file.startsWith(p));

/**
 * Uploads live hls output to the object store WHILE the broadcast is
 * running, so viewers can play http://<s3>/hls/<videoId>/master.m3u8
 * during the stream instead of only getting the replay afterwards.
 *
 * segments are uploaded once their size is stable across two ticks (the
 * hls muxer keeps writing the current segment until it rotates);
 * playlists are re-uploaded every tick because they only ever append.
 */
export class LiveUploader {
	private logger = new Logger(LiveUploader.name);
	private uploaded = new Set<string>();
	private lastSizes = new Map<string, number>();

	constructor(
		private dir: string,
		private minioDir: string,
		private client: {
			fPutObject: (bucket: string, key: string, path: string) => Promise<unknown>;
			putObject: (bucket: string, key: string, body: Buffer) => Promise<unknown>;
		},
		/** resume legs: variant manifest filename -> playlist already in storage */
		private prefixes?: Map<string, string>,
	) {}

	async tick(): Promise<void> {
		const files = (await readdir(this.dir)).filter(isUploadable);

		for (const file of files) {
			const fullPath = join(this.dir, file);

			if (file.endsWith('.m3u8')) {
				await this.upload(file, fullPath);
				continue;
			}

			if (this.uploaded.has(file)) continue;

			const { size } = await stat(fullPath);
			if (size > 0 && this.lastSizes.get(file) === size) {
				await this.upload(file, fullPath);
			}
			this.lastSizes.set(file, size);
		}
	}

	/** upload everything remaining — ffmpeg has exited, all files are final */
	async flush(): Promise<void> {
		const files = (await readdir(this.dir)).filter(isUploadable);
		for (const file of files) {
			try {
				await this.upload(file, join(this.dir, file));
			} catch (err: any) {
				// the file vanished between readdir and upload — a concurrently
				// ending job cleaned the shared directory, or it was already
				// uploaded during the stream; the segment is not worth failing
				// the whole broadcast over
				if (err?.code === 'ENOENT') continue;
				throw err;
			}
		}
	}

	private async upload(file: string, fullPath: string) {
		const prefix = this.prefixes?.get(file);
		if (prefix === undefined) {
			await this.client.fPutObject('hls', join(this.minioDir, file), fullPath);
			this.uploaded.add(file);
			return;
		}

		// resumed leg: the stored playlist, a discontinuity, then this leg's
		// entries (the local header up to the first #EXTINF is stripped).
		// until the first segment exists there is nothing to append — leave
		// the stored playlist alone rather than truncate it.
		const local = await readFile(fullPath, 'utf8');
		const at = local.indexOf('#EXTINF');
		if (at < 0) return;

		await this.client.putObject(
			'hls',
			join(this.minioDir, file),
			Buffer.from(prefix + '#EXT-X-DISCONTINUITY\n' + local.slice(at)),
		);
		this.uploaded.add(file);
	}
}
