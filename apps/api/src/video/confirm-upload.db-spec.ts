import { eq } from 'drizzle-orm';
import { closeDb, db, ensureMigrated, resetDb } from '../test/db';
import * as schema from '../drizzle/schema';
import { VideoService } from './video.service';

/**
 * integration tier: real drizzle queries against the test database —
 * the unit specs mock the query chains, these prove the SQL itself
 */
describe('confirmUpload against a real database', () => {
	let service: VideoService;
	let statObject: ReturnType<typeof vi.fn>;

	const user = { id: 1, email: 'owner@x.test' } as any;

	const seed = async () => {
		const [u] = await db
			.insert(schema.users)
			.values({ email: 'owner@x.test', password: 'x' })
			.returning();
		user.id = u.id;

		const [channel] = await db
			.insert(schema.channels)
			.values({ username: 'dbtestchan', name: 'DB Test', description: 'desc', ownerId: u.id })
			.returning();

		const [file] = await db
			.insert(schema.files)
			.values({
				bucketName: 'videos',
				path: 'dbtest-video.mp4',
				mimetype: 'video/mp4',
				sizeInByte: 1,
				userId: u.id,
			})
			.returning();

		const [video] = await db
			.insert(schema.videos)
			.values({
				videoId: 'dbtestvid000001',
				type: 'vod',
				name: 'db test video',
				description: 'desc desc desc',
				channelId: channel.id,
				processingStatus: 'ready_for_upload',
				videoFileId: file.id,
			})
			.returning();

		return { channel, file, video };
	};

	beforeAll(async () => {
		await ensureMigrated();
	});

	afterAll(async () => {
		await closeDb();
	});

	beforeEach(async () => {
		await resetDb();
		statObject = vi
			.fn()
			.mockResolvedValue({ size: 1234, metaData: { 'content-type': 'video/mp4' } });
		service = new VideoService(
			{ db } as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{
				client: { statObject },
			} as any,
		);
	});

	it('flips the video to ready_for_processing and updates the file row', async () => {
		const { video, file } = await seed();

		const result = await service.confirmUpload(video.id, user);

		expect(result.message).toContain('confirmed');

		const updatedFile = await db.query.files.findFirst({ where: eq(schema.files.id, file.id) });
		expect(updatedFile?.sizeInByte).toBe(1234);

		const updatedVideo = await db.query.videos.findFirst({ where: eq(schema.videos.id, video.id) });
		expect(updatedVideo?.processingStatus).toBe('ready_for_processing');
	});

	it('rejects a user who does not own the video', async () => {
		const { video } = await seed();

		await expect(service.confirmUpload(video.id, { id: 999 } as any)).rejects.toThrow();
	});
});
