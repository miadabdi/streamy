CREATE TABLE IF NOT EXISTS "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"username" varchar(100) NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" varchar(2048) DEFAULT 'avatar-default.png',
	"number_of_subscribers" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"owner_id" integer NOT NULL,
	CONSTRAINT "channels_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp (6) with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "channels_username_idx" ON "channels" ("username");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channels" ADD CONSTRAINT "channels_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
