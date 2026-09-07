CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"email" varchar(50) NOT NULL,
	"password" text NOT NULL,
	"first_name" varchar(30),
	"last_name" varchar(30),
	"is_admin" boolean DEFAULT false,
	"is_email_verified" boolean DEFAULT false,
	"password_changed_at" timestamp (6) with time zone,
	"password_reset_token" varchar(100),
	"password_reset_expires_at" timestamp (6) with time zone,
	"current_channel_id" integer,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");