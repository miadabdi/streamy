import { User } from '../drizzle/schema';
import { ChannelService } from './channel.service';
import {
	AddSubscriptionDto,
	CreateChannelDto,
	DeleteChannelDto,
	GetChannelByIdDto,
	GetChannelByUsernameDto,
	UpdateChannelDto,
} from './dto';
import { DeleteSubscriptionDto } from './dto/delete-subscription.dto';
export declare class ChannelController {
	private channelService;
	constructor(channelService: ChannelService);
	createChannel(
		createChannelDto: CreateChannelDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		username: string;
		numberOfSubscribers: number;
		ownerId: number;
		avatarFileId: number;
	}>;
	addSubscription(
		addSubscriptionDto: AddSubscriptionDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	deleteSubscription(
		deleteSubscriptionDto: DeleteSubscriptionDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	updateChannel(
		updateChannelDto: UpdateChannelDto,
		user: User,
		avatar: Express.Multer.File,
	): Promise<{
		name: string;
		description: string;
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		username: string;
		numberOfSubscribers: number;
		ownerId: number;
		avatarFileId: number;
	}>;
	getChannelById(
		getChannelByIdDto: GetChannelByIdDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		username: string;
		numberOfSubscribers: number;
		ownerId: number;
		avatarFileId: number;
	}>;
	getChannelByUsername(
		getChannelByUsernameDto: GetChannelByUsernameDto,
		user: User,
	): Promise<{
		name: string;
		description: string;
		id: number;
		createdAt: Date;
		updatedAt: Date;
		isActive: boolean;
		deletedAt: Date;
		username: string;
		numberOfSubscribers: number;
		ownerId: number;
		avatarFileId: number;
	}>;
	deleteChannel(
		deleteChannelDto: DeleteChannelDto,
		user: User,
	): Promise<{
		message: string;
	}>;
}
