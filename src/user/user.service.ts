import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { User } from '../drizzle/schema';
import { usersTableColumns } from '../drizzle/table-columns';
import { UpdateUserDto } from './dto';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(private drizzleService: DrizzleService) {}

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
}
