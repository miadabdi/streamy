import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { mapColsToReturningKeys } from '../common/helpers/map-cols-to-returning-keys';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { usersTableColumns } from '../drizzle/table-columns';
import { UpdateUserDto } from './dto';
import { SetCurrentChannelDto } from './dto/set-current-channel.dto';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private drizzleService: DrizzleService) {}

	async getMe(user: User, tx?: TransactionType) {
		const manager = tx ? tx : this.drizzleService.db;

		const { passwordChangedAt, passwordResetToken, passwordResetExpiresAt, password, ...userKeys } =
			usersTableColumns;
		const returningKeys = mapColsToReturningKeys(userKeys);

		const userRecord = await manager.query.users.findFirst({
			where: eq(schema.users.id, user.id),
			with: {
				channels: true,
			},
			columns: returningKeys,
		});

		return userRecord;
	}

	async updateUser(updateUserDto: UpdateUserDto, user: User) {
		const {
			password,
			passwordChangedAt,
			passwordResetToken,
			passwordResetExpiresAt,
			...returningKeys
		} = usersTableColumns;

		const updateResults = await this.drizzleService.db
			.update(schema.users)
			.set(updateUserDto)
			.where(eq(schema.users.id, user.id))
			.returning({ ...returningKeys })
			.execute();

		const updatedUser = updateResults[0];

		return updatedUser;
	}

	async setCurrentChannel(
		setCurrentChannelDto: SetCurrentChannelDto,
		user: User,
		tx?: TransactionType,
	) {
		const {
			password,
			passwordChangedAt,
			passwordResetToken,
			passwordResetExpiresAt,
			...returningKeys
		} = usersTableColumns;

		const manager = tx ? tx : this.drizzleService.db;

		const channel = await manager.query.channels.findFirst({
			where: eq(schema.channels.id, setCurrentChannelDto.currentChannelId),
		});

		if (!channel) {
			throw new NotFoundException('Channel not found');
		}
		if (channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this channel");
		}

		const updateResults = await manager
			.update(schema.users)
			.set({ currentChannelId: setCurrentChannelDto.currentChannelId })
			.where(eq(schema.users.id, user.id))
			.returning(returningKeys)
			.execute();

		const updatedUser = updateResults[0];

		return updatedUser;
	}
}
