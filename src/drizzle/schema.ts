import { relations } from 'drizzle-orm';
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
		lastLoginAt: timestamp('last_login_at', {
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

export const usersRelations = relations(users, ({ many }) => ({
	files: many(files),
	channels: many(channels),
}));

export const files = pgTable(
	'files',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		bucketName: varchar('bucket_name', { length: 100 }).notNull(),
		path: text('path').notNull(),
		mimetype: varchar('mimetype', { length: 50 }).notNull(),
		sizeInByte: integer('size_in_byte').notNull(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id),
	},
	(files) => {
		return {};
	},
);

export const filesRelations = relations(files, ({ many, one }) => ({
	user: one(users, {
		fields: [files.userId],
		references: [users.id],
	}),
}));

export const channels = pgTable(
	'channels',
	{
		id: serial('id').primaryKey(),
		createdAt: timestamp('created_at', { precision: 6, withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 6, withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date()),
		username: varchar('username', { length: 100 }).notNull().unique(),
		name: varchar('name', { length: 50 }).notNull(),
		description: varchar('description', { length: 1024 }).notNull(),
		numberOfsubscribers: integer('number_of_subscribers').default(0),
		isActive: boolean('is_active').default(true),
		ownerId: integer('owner_id')
			.notNull()
			.references(() => users.id),
		avatar: varchar('description', { length: 2048 }).default('avatar-default.png'),
	},
	(channels) => {
		return {
			usernameIdx: uniqueIndex('channels_username_idx').on(channels.username),
		};
	},
);

export const channelsRelations = relations(channels, ({ many, one }) => ({
	owner: one(users, {
		fields: [channels.ownerId],
		references: [users.id],
	}),
}));

export type User = typeof users.$inferSelect;
export type File = typeof files.$inferSelect;
export type Channel = typeof channels.$inferSelect;
