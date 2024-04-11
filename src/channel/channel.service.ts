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
import { User } from '../drizzle/schema';
import { channelsTableColumns } from '../drizzle/table-columns';
import { FileService } from '../file/file.service';
import { CreateChannelDto, DeleteChannelDto, UpdateChannelDto } from './dto';

@Injectable()
export class ChannelService {
	private logger = new Logger(ChannelService.name);

	constructor(
		private drizzleService: DrizzleService,
		private fileService: FileService,
	) {}

	async createChannel(createChannelDto: CreateChannelDto, user: User, tx?: TransactionType) {
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

	async updateChannel(
		updateChannelDto: UpdateChannelDto,
		user: User,
		avatar?: Express.Multer.File,
	) {
		const channel = await this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, updateChannelDto.id),
		});

		if (!channel) {
			throw new NotFoundException('Channel not found');
		}

		if (channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this channel");
		}

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

	async getChannelByUsername(username: string) {
		return this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.username, username),
		});
	}

	async getChannelById(id: number) {
		return this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, id),
		});
	}

	async deleteChannel(deleteChannelDto: DeleteChannelDto, @GetUser() user: User) {
		const channel = await this.drizzleService.db.query.channels.findFirst({
			where: eq(schema.channels.id, deleteChannelDto.id),
		});

		if (!channel) {
			throw new NotFoundException('Channel not found');
		}

		if (channel.ownerId !== user.id) {
			throw new ForbiddenException("You don't own this channel");
		}

		await this.drizzleService.db
			.update(schema.channels)
			.set({ isActive: false })
			.where(eq(schema.channels.id, deleteChannelDto.id));

		return {
			message: 'Channel Deleted Successfully',
		};
	}
}
