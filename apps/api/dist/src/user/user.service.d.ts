import { ConfigService } from '@nestjs/config';
import { ChannelService } from '../channel/channel.service';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import { User } from '../drizzle/schema';
import { UpdateUserDto } from './dto';
import { SetCurrentChannelDto } from './dto/set-current-channel.dto';
export declare class UserService {
	private drizzleService;
	private channelService;
	private configService;
	private readonly logger;
	constructor(
		drizzleService: DrizzleService,
		channelService: ChannelService,
		configService: ConfigService,
	);
	onModuleInit(): Promise<void>;
	promoteUser(email: string): Promise<{
		message: string;
	}>;
	getMe(user: User, tx?: TransactionType): Promise<User>;
	updateUser(
		updateUserDto: UpdateUserDto,
		user: User,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		email: string;
		firstName: string;
		lastName: string;
		isAdmin: boolean;
		isEmailVerified: boolean;
		lastLoginAt: Date;
		currentChannelId: number;
	}>;
	setCurrentChannel(
		setCurrentChannelDto: SetCurrentChannelDto,
		user: User,
		tx?: TransactionType,
	): Promise<{
		id: number;
		createdAt: Date;
		updatedAt: Date;
		email: string;
		firstName: string;
		lastName: string;
		isAdmin: boolean;
		isEmailVerified: boolean;
		lastLoginAt: Date;
		currentChannelId: number;
	}>;
}
