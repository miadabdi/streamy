import { z } from 'zod';

// Mirrors apps/api/src/auth/dto (sign-up.dto.ts, create-channel.dto.ts) exactly —
// same min/max/regex constraints — so the client never posts what the server rejects.
const CHANNEL_USERNAME_REGEX = /^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;

const email = z.email('Enter a valid email address');
const password = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.max(32, 'Password must be at most 32 characters');

const channel = z.object({
	username: z
		.string()
		.min(8, 'Channel username must be at least 8 characters')
		.max(128, 'Channel username must be at most 128 characters')
		.regex(
			CHANNEL_USERNAME_REGEX,
			'Channel username must contain no _ or . at the beginning or end',
		),
	name: z
		.string()
		.min(3, 'Display name must be at least 3 characters')
		.max(50, 'Display name must be at most 50 characters'),
	description: z
		.string()
		.min(8, 'Description must be at least 8 characters')
		.max(1024, 'Description must be at most 1024 characters'),
});

export const signInSchema = z.object({ email, password });
export const signUpSchema = z.object({ email, password, channel });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
	email,
	password,
	token: z.string().length(64, 'Reset token must be 64 characters'),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
