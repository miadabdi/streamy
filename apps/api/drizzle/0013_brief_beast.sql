CREATE TABLE IF NOT EXISTS "subscriptions" (
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"follower_id" integer,
	"followee_id" integer,
	CONSTRAINT "subscription_pk" PRIMARY KEY("followee_id","follower_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_follower_id_channels_id_fk" FOREIGN KEY ("follower_id") REFERENCES "channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_followee_id_channels_id_fk" FOREIGN KEY ("followee_id") REFERENCES "channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
