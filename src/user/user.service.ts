import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ChannelService } from '../channel/channel.service';
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

	constructor(
		private drizzleService: DrizzleService,
		private channelService: ChannelService,
	) {}

	/**
	 * fetches allowed user info and returns it
	 * @param {User} user
	 * @param {TransactionType} [tx]
	 * @returns {User}
	 */
	async getMe(user: User, tx?: TransactionType): Promise<User> {
		const manager = tx ? tx : this.drizzleService.db;

		// FIXME: fetching an already available user?

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

	/**
	 * updates user info
	 * @param {UpdateUserDto} updateUserDto
	 * @param {User} user
	 * @returns {User}
	 */
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

	/**
	 * switches active channel of user, and saves it into user document
	 * @param {SetCurrentChannelDto} setCurrentChannelDto
	 * @param {User} user
	 * @param {TransactionType} [tx]
	 * @returns {User}
	 * @throws {NotFoundException} channel not found
	 * @throws {ForbiddenException} if user does not own the channel
	 */
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

		await this.channelService.userOwnsChannel(setCurrentChannelDto.currentChannelId, user);

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
