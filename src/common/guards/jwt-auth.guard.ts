import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_STRATEGY_NAME } from '../../common/constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {}
