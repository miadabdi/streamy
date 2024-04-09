import { Body, Controller, Get, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { JWT_COOKIE_NAME } from '../common/constants';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60 * 10 } }) // 10 auth requests for 10 minutes
@Controller({ path: 'auth', version: '1' })
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@HttpCode(HttpStatus.CREATED)
	@Post('signup')
	signUp(@Body() authDto: AuthDto) {
		return this.authService.signUp(authDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('signin')
	signIn(@Res({ passthrough: true }) response: Response, @Body() authDto: AuthDto) {
		return this.authService.signIn(response, authDto);
	}

	@HttpCode(HttpStatus.OK)
	@Get('signout')
	async logout(@Res({ passthrough: true }) response: Response) {
		response.cookie(JWT_COOKIE_NAME, '', { expires: new Date() });
	}
}
