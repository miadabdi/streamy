import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DrizzleService } from '../drizzle/drizzle.service';
import { VideoService } from '../video/video.service';
import { CommentService } from './comment.service';

describe('CommentService ownership', () => {
	let service: CommentService;
	let commentsFindFirst: jest.Mock;
	let channelsFindFirst: jest.Mock;
	let insertExecute: jest.Mock;

	const user = { id: 5 } as any;

	beforeEach(async () => {
		commentsFindFirst = jest.fn();
		channelsFindFirst = jest.fn();
		insertExecute = jest.fn().mockResolvedValue([{ id: 1 }]);

		const insert = jest.fn().mockReturnValue({
			values: jest.fn().mockReturnValue({
				returning: jest.fn().mockReturnValue({ execute: insertExecute }),
			}),
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				CommentService,
				{
					provide: DrizzleService,
					useValue: {
						db: {
							query: {
								comments: { findFirst: commentsFindFirst },
								channels: { findFirst: channelsFindFirst },
							},
							insert,
						},
					},
				},
				{
					provide: VideoService,
					useValue: { getVideoById: jest.fn().mockResolvedValue({ id: 2 }) },
				},
			],
		}).compile();
		service = moduleRef.get(CommentService);
	});

	it('allows the owner of the comment channel to update/delete', async () => {
		commentsFindFirst.mockResolvedValue({ id: 1, ownerId: 7, owner: { id: 7, ownerId: 5 } });

		await expect(service.userOwnsComment(1, user)).resolves.toBeUndefined();
	});

	it('rejects a user who does not own the comment channel', async () => {
		commentsFindFirst.mockResolvedValue({ id: 1, ownerId: 7, owner: { id: 7, ownerId: 42 } });

		await expect(service.userOwnsComment(1, user)).rejects.toThrow(ForbiddenException);
	});

	it('rejects comment creation on a channel the user does not own', async () => {
		channelsFindFirst.mockResolvedValue({ id: 7, ownerId: 42 });

		await expect(
			service.createComment({ videoId: 2, ownerId: 7, content: 'nice video!' } as any, user),
		).rejects.toThrow(ForbiddenException);
	});

	it('rejects comment creation for a non-existent channel', async () => {
		channelsFindFirst.mockResolvedValue(undefined);

		await expect(
			service.createComment({ videoId: 2, ownerId: 7, content: 'nice video!' } as any, user),
		).rejects.toThrow(NotFoundException);
	});

	it('creates a comment when the user owns the channel', async () => {
		channelsFindFirst.mockResolvedValue({ id: 7, ownerId: 5 });

		const result = await service.createComment(
			{ videoId: 2, ownerId: 7, content: 'nice video!' } as any,
			user,
		);

		expect(result).toEqual({ id: 1 });
	});
});
