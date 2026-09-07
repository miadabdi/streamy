import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import * as schema from '../../drizzle/schema';

/**
 * rejects requests whose authenticated user is not an admin; must run
 * after JwtAuthGuard so request.user is populated
 */
@Injectable()
export class AdminGuard implements CanActivate {
	constructor(private drizzleService: DrizzleService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const { userId } = request.user ?? {};

		if (!userId) {
			throw new ForbiddenException('Admin access required');
		}

		// the jwt payload carries no role; the source of truth is the row
		const user = await this.drizzleService.db.query.users.findFirst({
			where: eq(schema.users.id, userId),
		});

		if (!user?.isAdmin) {
			throw new ForbiddenException('Admin access required');
		}

		return true;
	}
}
