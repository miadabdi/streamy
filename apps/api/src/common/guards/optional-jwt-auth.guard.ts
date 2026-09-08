import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../../common/constants';

/**
 * resolves the user from the jwt cookie when present but never
 * rejects; pairs with @Public() on routes that serve anonymous
 * callers yet behave differently for a signed-in owner
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
	handleRequest<TUser = any>(_err: any, user: any): TUser {
		return (user || undefined) as TUser;
	}
}
