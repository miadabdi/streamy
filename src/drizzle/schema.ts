import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';

// // declaring enum in database
// export const popularityEnum = pgEnum('popularity', ['unknown', 'known', 'popular']);

// Index name convention: [tableName]_[field]_idx

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		email: varchar('email', { length: 50 }).unique().notNull(),
		password: text('password').notNull(),
		firstName: varchar('first_name', { length: 30 }),
		lastName: varchar('last_name', { length: 30 }),
		isAdmin: boolean('is_admin').default(false),
		isEmailVerified: boolean('is_email_verified').default(false),
		passwordChangedAt: timestamp('password_changed_at', { precision: 6, withTimezone: true }),
		passwordResetToken: varchar('password_reset_token', { length: 100 }),
		passwordResetExpiresAt: timestamp('password_reset_expires_at', {
			precision: 6,
			withTimezone: true,
		}),
		currentChannelId: integer('current_channel_id'),
	},
	(users) => {
		return {
			emailIdx: uniqueIndex('users_email_idx').on(users.email),
		};
	},
);

export type User = typeof users.$inferSelect;
