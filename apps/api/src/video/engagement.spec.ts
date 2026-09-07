import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ChannelService } from '../channel/channel.service';
import { DrizzleService } from '../drizzle/drizzle.service';
import { FileService } from '../file/file.service';
import { MinioClientService } from '../minio-client/minio-client.service';
import { PlaylistService } from '../playlist/playlist.service';
import { ConsumerService } from '../queue/consumer.service';
import { ProducerService } from '../queue/producer.service';
import VideoSearchService from '../search/video-search.service';
import { TagService } from '../tag/tags.service';
import { VideoService } from './video.service';

describe('VideoService engagement', () => {
	let service: VideoService;
	let getPlaylistsOfChannel: ReturnType<typeof vi.fn>;
	let addVideos: ReturnType<typeof vi.fn>;
	let updateExecute: ReturnType<typeof vi.fn>;
	let videosFindFirst: ReturnType<typeof vi.fn>;

	const user = { id: 1 } as any;

	const playlists = (types: string[]) =>
		types.map((type, i) => ({
			id: i + 1,
			type: { likes: 'likes', dislikes: 'dislikes', watched: 'watched' }[type],
		}));

	beforeEach(async () => {
		getPlaylistsOfChannel = vi.fn();
		addVideos = vi.fn().mockResolvedValue(undefined);
		updateExecute = vi.fn().mockResolvedValue(undefined);
		videosFindFirst = vi.fn().mockResolvedValue({ id: 9, name: 'v', channelId: 2 });

		const update = vi.fn().mockReturnValue({
			set: vi.fn().mockReturnValue({
				where: vi.fn().mockReturnValue({ execute: updateExecute }),
			}),
		});

		const moduleRef = await Test.createTestingModule({
			providers: [
				VideoService,
				{
					provide: DrizzleService,
					useValue: { db: { query: { videos: { findFirst: videosFindFirst } }, update } },
				},
				{ provide: MinioClientService, useValue: {} },
				{ provide: FileService, useValue: {} },
				{ provide: ChannelService, useValue: {} },
				{ provide: ProducerService, useValue: {} },
				{ provide: ConsumerService, useValue: {} },
				{ provide: TagService, useValue: {} },
				{ provide: PlaylistService, useValue: { getPlaylistsOfChannel, addVideos } },
				{ provide: VideoSearchService, useValue: { indexVideo: vi.fn() } },
			],
		}).compile();
		service = moduleRef.get(VideoService);
	});

	describe('watchedVideo', () => {
		it('rejects when the channel has no watched playlist', async () => {
			getPlaylistsOfChannel.mockResolvedValue(playlists(['likes']));

			await expect(
				service.watchedVideo({ videoId: 9, watcherChannelId: 3 } as any, user),
			).rejects.toThrow(BadRequestException);
		});

		it('adds the video to the watched playlist and bumps numberOfVisits', async () => {
			getPlaylistsOfChannel.mockResolvedValue(playlists(['likes', 'watched', 'dislikes']));

			await service.watchedVideo({ videoId: 9, watcherChannelId: 3 } as any, user);

			expect(addVideos).toHaveBeenCalledWith({ videoIds: [9], playlistId: 2 }, user, undefined);
			expect(updateExecute).toHaveBeenCalledTimes(1);
		});
	});

	describe('likeDislikeVideo', () => {
		it('rejects like when the channel has no likes playlist', async () => {
			getPlaylistsOfChannel.mockResolvedValue(playlists(['watched']));

			await expect(
				service.likeDislikeVideo({ type: 'like', videoId: 9, likerChannelId: 3 } as any, user),
			).rejects.toThrow(BadRequestException);
		});

		it('likes into the likes playlist', async () => {
			getPlaylistsOfChannel.mockResolvedValue(playlists(['likes', 'dislikes']));

			await service.likeDislikeVideo({ type: 'like', videoId: 9, likerChannelId: 3 } as any, user);

			expect(addVideos).toHaveBeenCalledWith({ videoIds: [9], playlistId: 1 }, user, undefined);
			expect(updateExecute).toHaveBeenCalledTimes(1);
		});

		it('dislikes into the dislikes playlist', async () => {
			getPlaylistsOfChannel.mockResolvedValue(playlists(['likes', 'dislikes']));

			await service.likeDislikeVideo(
				{ type: 'dislike', videoId: 9, likerChannelId: 3 } as any,
				user,
			);

			expect(addVideos).toHaveBeenCalledWith({ videoIds: [9], playlistId: 2 }, user, undefined);
		});
	});
});
