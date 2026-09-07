import { User } from '../drizzle/schema';
import { SetCurrentChannelDto, UpdateUserDto, PromoteUserDto } from './dto';
import { UserService } from './user.service';
export declare class UserController {
	private readonly userService;
	constructor(userService: UserService);
	getMe(user: User): Promise<{
		password: string;
		email: string;
		id: number;
		createdAt: Date;
		updatedAt: Date;
		firstName: string;
		lastName: string;
		isAdmin: boolean;
		isEmailVerified: boolean;
		passwordChangedAt: Date;
		passwordResetToken: string;
		passwordResetExpiresAt: Date;
		lastLoginAt: Date;
		currentChannelId: number;
	}>;
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
	promoteUser(
		promoteUserDto: PromoteUserDto,
		user: User,
	): Promise<{
		message: string;
	}>;
	setCurrentChannel(
		setCurrentChannelDto: SetCurrentChannelDto,
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
}
