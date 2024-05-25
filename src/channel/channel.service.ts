import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { and, eq, not } from 'drizzle-orm';
import { GetUser } from '../common/decorators';
import { TransactionType } from '../common/types/transaction.type';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { Channel, User } from '../drizzle/schema';
import { channelsTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { AddSubscriptionDto, CreateChannelDto, DeleteChannelDto, UpdateChannelDto } from './dto';
import { DeleteSubscriptionDto } from './dto/delete-subscription.dto';

@Injectable()
export class ChannelService {
	private logger = new Logger(ChannelService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
	) {}

	/**
	 * checks if user owns channel with id of id
	 * @param {number} id
	 * @param {User} user
	 * @param {TransactionType} [tx]
	 * @throws {NotFoundException} id not found in channels table
	 * @throws {ForbiddenException} user must own channel
	 */
	async userOwnsChannel(id: number, user: User, tx?: TransactionType): Promise<undefined> {
		const manager = tx ? tx : this.drizzleService.db;

		const channel = await manager.query.channels.findFirst({
			where: eq(schema.channels.id, id),
		});

		if (!channel) {
			throw new NotFoundException(`Channel with id ${id} not found`);
		}

		if (channel.ownerId !== user.id) {
			throw new ForbiddenException(`You don't own channel with id ${id}`);
		}
	}

	/**
	 * creates a channel
	 * @param {CreateChannelDto} createChannelDto
	 * @param {User} user
	 * @param {TransactionType} tx pass to user certain transaction for operations
	 * @returns {Channel}
	 */
	async createChannel(
		createChannelDto: CreateChannelDto,
		user: User,
		tx?: TransactionType,
	): Promise<Channel> {
		const manager = tx ? tx : this.drizzleService.db;

		const dupChannel = await manager.query.channels.findFirst({
			where: eq(schema.channels.username, createChannelDto.username),
		});

		if (dupChannel) {
			throw new ConflictException('Channel with this username already exists');
		}

		const { ...returningKeys } = channelsTableColumns;
		const channel = await manager
			.insert(schema.channels)
			.values({
				ownerId: user.id,
				...createChannelDto,
			})
			.returning(returningKeys)
			.execute();

		return channel[0];
	}

	/**
	 * updates a channel's info, and replaces its avatar
	 * @param {UpdateChannelDto} updateChannelDto
	 * @param {User} user
	 * @param {Express.Multer.File} avatar
	 * @returns {Channel}
	 */
	async updateChannel(
		updateChannelDto: UpdateChannelDto,
		user: User,
		avatar?: Express.Multer.File,
	): Promise<Channel> {
		await this.userOwnsChannel(updateChannelDto.id, user);

		if (updateChannelDto.username) {
			const dupChannel = await this.drizzleService.db.query.channels.findFirst({
				where: and(
					eq(schema.channels.username, updateChannelDto.username),
					not(eq(schema.channels.id, updateChannelDto.id)),
				),
			});

			if (dupChannel) {
				throw new ConflictException('Channel with this username already exists');
			}
		}

		if (avatar) {
			const file = await this.fileService.uploadAndCreateFileRecord(
				avatar,
				'',
				'channelavatars',
				user,
			);

			updateChannelDto.avatarFileId = file.id;
		}

		const { ...returningKeys } = channelsTableColumns;
		const updatedChannel = await this.drizzleService.db
			.update(schema.channels)
			.set({
				...updateChannelDto,
			})
			.where(eq(schema.channels.id, updateChannelDto.id))
			.returning(returningKeys)
			.execute();

		return updatedChannel[0];
	}

	/**
	 * removes a subscription
	 * @param {DeleteSubscriptionDto} deleteSubscriptionDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async deleteSubscription(
		deleteSubscriptionDto: DeleteSubscriptionDto,
		user: User,
	): Promise<{ message: string }> {
		await this.userOwnsChannel(deleteSubscriptionDto.followerId, user);

		const followee = await this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, deleteSubscriptionDto.followeeId),
		});

		if (!followee) {
			throw new NotFoundException(
				`Followee channel with id ${deleteSubscriptionDto.followeeId} not found`,
			);
		}

		await this.drizzleService.db
			.delete(schema.subscriptions)
			.where(
				and(
					eq(schema.subscriptions.followeeId, deleteSubscriptionDto.followeeId),
					eq(schema.subscriptions.followerId, deleteSubscriptionDto.followerId),
				),
			)
			.execute();

		return {
			message: 'Subscription deleted successfully',
		};
	}

	/**
	 * adds a subscription
	 * @param {AddSubscriptionDto} addSubscriptionDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async addSubscription(
		addSubscriptionDto: AddSubscriptionDto,
		user: User,
	): Promise<{ message: string }> {
		await this.userOwnsChannel(addSubscriptionDto.followerId, user);

		const followee = await this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, addSubscriptionDto.followeeId),
		});

		if (!followee) {
			throw new NotFoundException(
				`Followee channel with id ${addSubscriptionDto.followeeId} not found`,
			);
		}

		await this.drizzleService.db
			.insert(schema.subscriptions)
			.values(addSubscriptionDto)
			.onConflictDoNothing()
			.execute();

		return {
			message: 'Subscription added successfully',
		};
	}

	/**
	 * finds a channel with specific username and returns if exists
	 * @param {string} username username of a channel
	 * @returns {Channel | null}
	 */
	async getChannelByUsername(username: string): Promise<Channel | null> {
		return this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.username, username),
			with: {
				subscriptions: {
					with: {
						followee: true,
					},
				},
			},
		});
	}

	/**
	 * finds a channel with specific id and returns if exists
	 * @param {number} id id of a channel
	 * @returns {Channel | null}
	 */
	async getChannelById(id: number): Promise<Channel | null> {
		return this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, id),
			with: {
				subscriptions: {
					with: {
						followee: true,
					},
				},
			},
		});
	}

	/**
	 * deletes a channel
	 * @param {DeleteChannelDto} deleteChannelDto
	 * @param {User} user
	 * @returns {{ message: string }}
	 */
	async deleteChannel(
		deleteChannelDto: DeleteChannelDto,
		@GetUser() user: User,
	): Promise<{ message: string }> {
		await this.userOwnsChannel(deleteChannelDto.id, user);

		await this.drizzleService.db
			.update(schema.channels)
			.set({ isActive: false, deletedAt: new Date() })
			.where(eq(schema.channels.id, deleteChannelDto.id));

		return {
			message: 'Channel Deleted Successfully',
		};
	}
}
