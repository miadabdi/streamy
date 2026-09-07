import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
	OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, inArray } from 'drizzle-orm';
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
		private configService: ConfigService,
	) {}

	/**
	 * promotes the emails listed in ADMIN_EMAILS to admin at boot — the
	 * only way to bootstrap the first admin without raw sql
	 */
	async onModuleInit() {
		const emails = (this.configService.get<string>('ADMIN_EMAILS') ?? '')
			.split(',')
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean);

		if (emails.length === 0) return;

		const promoted = await this.drizzleService.db
			.update(schema.users)
			.set({ isAdmin: true })
			.where(inArray(schema.users.email, emails))
			.returning({ email: schema.users.email })
			.execute();

		this.logger.log(`ADMIN_EMAILS: ${promoted.length} of ${emails.length} account(s) are admins`);
	}

	/**
	 * grants admin to an existing account; admin-only via the controller
	 * @param {string} email
	 * @returns {Promise<{ message: string }>}
	 */
	async promoteUser(email: string): Promise<{ message: string }> {
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.email, email.toLowerCase()),
		});

		if (!user) {
			throw new NotFoundException(`User with email ${email} not found`);
		}

		await this.drizzleService.db
			.update(schema.users)
			.set({ isAdmin: true })
			.where(eq(schema.users.id, user.id))
			.execute();

		return { message: 'User promoted to admin successfully' };
	}

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

		await this.channelService.userOwnsChannel(setCurrentChannelDto.currentChannelId, user, tx);

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
