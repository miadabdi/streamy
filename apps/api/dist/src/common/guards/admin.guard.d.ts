import { CanActivate, ExecutionContext } from '@nestjs/common';
import { DrizzleService } from '../../drizzle/drizzle.service';
export declare class AdminGuard implements CanActivate {
	private drizzleService;
	constructor(drizzleService: DrizzleService);
	canActivate(context: ExecutionContext): Promise<boolean>;
}
