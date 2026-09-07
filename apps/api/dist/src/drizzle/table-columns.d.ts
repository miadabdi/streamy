export declare const usersTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'users';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'users';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'users';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	email: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'email';
			tableName: 'users';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 50;
		}
	>;
	password: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'password';
			tableName: 'users';
			dataType: 'string';
			columnType: 'PgText';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	firstName: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'first_name';
			tableName: 'users';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 30;
		}
	>;
	lastName: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'last_name';
			tableName: 'users';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 30;
		}
	>;
	isAdmin: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_admin';
			tableName: 'users';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isEmailVerified: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_email_verified';
			tableName: 'users';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	passwordChangedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'password_changed_at';
			tableName: 'users';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	passwordResetToken: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'password_reset_token';
			tableName: 'users';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 100;
		}
	>;
	passwordResetExpiresAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'password_reset_expires_at';
			tableName: 'users';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	lastLoginAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'last_login_at';
			tableName: 'users';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	currentChannelId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'current_channel_id';
			tableName: 'users';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const filesTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'files';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'files';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'files';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	bucketName: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'bucket_name';
			tableName: 'files';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 100;
		}
	>;
	path: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'path';
			tableName: 'files';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 1024;
		}
	>;
	mimetype: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'mimetype';
			tableName: 'files';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 50;
		}
	>;
	sizeInByte: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'size_in_byte';
			tableName: 'files';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	userId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'user_id';
			tableName: 'files';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const channelsTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'channels';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'channels';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'channels';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isActive: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_active';
			tableName: 'channels';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	deletedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'deleted_at';
			tableName: 'channels';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	username: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'username';
			tableName: 'channels';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 100;
		}
	>;
	name: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'name';
			tableName: 'channels';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 50;
		}
	>;
	description: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'description';
			tableName: 'channels';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 1024;
		}
	>;
	numberOfSubscribers: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'number_of_subscribers';
			tableName: 'channels';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	ownerId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'owner_id';
			tableName: 'channels';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	avatarFileId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'avatar_file_id';
			tableName: 'channels';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const videosTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	videoId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'video_id';
			tableName: 'videos';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 20;
		}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'videos';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'videos';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isActive: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_active';
			tableName: 'videos';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	deletedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'deleted_at';
			tableName: 'videos';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isReleased: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_released';
			tableName: 'videos';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	releasedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'released_at';
			tableName: 'videos';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	type: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'type';
			tableName: 'videos';
			dataType: 'string';
			columnType: 'PgEnumColumn';
			data: 'live' | 'vod';
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: ['vod', 'live'];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	name: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'name';
			tableName: 'videos';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 256;
		}
	>;
	description: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'description';
			tableName: 'videos';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 2048;
		}
	>;
	numberOfVisits: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'number_of_visits';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	numberOfLikes: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'number_of_likes';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	numberOfDislikes: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'numberOfDislikes';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	channelId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'channel_id';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	duration: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'duration';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	ffmpegProcessLogs: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'ffmpeg_process_logs';
			tableName: 'videos';
			dataType: 'string';
			columnType: 'PgText';
			data: string;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	thumbnailFileId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'thumbnail_file_id';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	processingStatus: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'processing_status';
			tableName: 'videos';
			dataType: 'string';
			columnType: 'PgEnumColumn';
			data:
				| 'failed_in_processing'
				| 'done'
				| 'ready_for_upload'
				| 'ready_for_processing'
				| 'waiting_in_queue'
				| 'processing';
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [
				'ready_for_upload',
				'ready_for_processing',
				'waiting_in_queue',
				'processing',
				'failed_in_processing',
				'done',
			];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	videoFileId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'video_file_id';
			tableName: 'videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const subtitlesTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'subtitles';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'subtitles';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'subtitles';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isActive: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_active';
			tableName: 'subtitles';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	deletedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'deleted_at';
			tableName: 'subtitles';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	langRFC5646: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'lang_RFC5646';
			tableName: 'subtitles';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 256;
		}
	>;
	videoId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'video_id';
			tableName: 'subtitles';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	fileId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'file_id';
			tableName: 'subtitles';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const playlistsTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'playlists';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'playlists';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'playlists';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isActive: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_active';
			tableName: 'playlists';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	deletedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'deleted_at';
			tableName: 'playlists';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	name: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'name';
			tableName: 'playlists';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 256;
		}
	>;
	description: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'description';
			tableName: 'playlists';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 2048;
		}
	>;
	channelId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'channel_id';
			tableName: 'playlists';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	privacy: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'privacy';
			tableName: 'playlists';
			dataType: 'string';
			columnType: 'PgEnumColumn';
			data: 'private' | 'public';
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: ['private', 'public'];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	type: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'type';
			tableName: 'playlists';
			dataType: 'string';
			columnType: 'PgEnumColumn';
			data: 'custom' | 'likes' | 'dislikes' | 'watched';
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: ['likes', 'dislikes', 'watched', 'custom'];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const playlistsVideosTableColumns: {
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'playlists_videos';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	playlistId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'playlist_id';
			tableName: 'playlists_videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	videoId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'video_id';
			tableName: 'playlists_videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const tagsTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'tags';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'tags';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'tags';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isActive: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_active';
			tableName: 'tags';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	deletedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'deleted_at';
			tableName: 'tags';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	title: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'title';
			tableName: 'tags';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 128;
		}
	>;
};
export declare const tagsVideosTableColumns: {
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'tags_videos';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	tagId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'tag_id';
			tableName: 'tags_videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	videoId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'video_id';
			tableName: 'tags_videos';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const subscriptionsTableColumns: {
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'subscriptions';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	followerId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'follower_id';
			tableName: 'subscriptions';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	followeeId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'followee_id';
			tableName: 'subscriptions';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
};
export declare const commentsTableColumns: {
	id: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'id';
			tableName: 'comments';
			dataType: 'number';
			columnType: 'PgSerial';
			data: number;
			driverParam: number;
			notNull: true;
			hasDefault: true;
			isPrimaryKey: true;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	createdAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'created_at';
			tableName: 'comments';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	updatedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'updated_at';
			tableName: 'comments';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isActive: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_active';
			tableName: 'comments';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	deletedAt: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'deleted_at';
			tableName: 'comments';
			dataType: 'date';
			columnType: 'PgTimestamp';
			data: Date;
			driverParam: string;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	isEdited: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'is_edited';
			tableName: 'comments';
			dataType: 'boolean';
			columnType: 'PgBoolean';
			data: boolean;
			driverParam: boolean;
			notNull: false;
			hasDefault: true;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	videoId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'video_id';
			tableName: 'comments';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	ownerId: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'owner_id';
			tableName: 'comments';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	replyTo: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'reply_to';
			tableName: 'comments';
			dataType: 'number';
			columnType: 'PgInteger';
			data: number;
			driverParam: string | number;
			notNull: false;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: undefined;
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{}
	>;
	content: import('drizzle-orm/pg-core').PgColumn<
		{
			name: 'content';
			tableName: 'comments';
			dataType: 'string';
			columnType: 'PgVarchar';
			data: string;
			driverParam: string;
			notNull: true;
			hasDefault: false;
			isPrimaryKey: false;
			isAutoincrement: false;
			hasRuntimeDefault: false;
			enumValues: [string, ...string[]];
			baseColumn: never;
			identity: undefined;
			generated: undefined;
		},
		{},
		{
			length: 1024;
		}
	>;
};
