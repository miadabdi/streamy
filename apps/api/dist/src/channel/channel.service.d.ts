import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import { Channel, User } from '../drizzle/schema';
import { FileService } from '../file/file.service';
import { PlaylistService } from '../playlist/playlist.service';
import { AddSubscriptionDto, CreateChannelDto, DeleteChannelDto, UpdateChannelDto } from './dto';
import { DeleteSubscriptionDto } from './dto/delete-subscription.dto';
export declare class ChannelService {
	private drizzleService;
	private fileService;
	private playlistService;
	private logger;
	constructor(
		drizzleService: DrizzleService,
		fileService: FileService,
		playlistService: PlaylistService,
	);
	userOwnsChannel(id: number, user: User, tx?: TransactionType): Promise<undefined>;
	createChannel(
		createChannelDto: CreateChannelDto,
		user: User,
		tx?: TransactionType,
	): Promise<Channel>;
	updateChannel(
		updateChannelDto: UpdateChannelDto,
		user: User,
		avatar?: Express.Multer.File,
	): Promise<Channel>;
	deleteSubscription(
		deleteSubscriptionDto: DeleteSubscriptionDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	addSubscription(
		addSubscriptionDto: AddSubscriptionDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	getChannelByUsername(username: string): Promise<Channel | null>;
	getChannelById(id: number): Promise<Channel | null>;
	deleteChannel(
		deleteChannelDto: DeleteChannelDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
