DO $$ BEGIN
 CREATE TYPE "video_proccessing_status" AS ENUM('ready_for_upload', 'ready_for_processing', 'waiting_in_queue', 'processing', 'failed_in_processing', 'done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"deleted_at" timestamp (6) with time zone,
	"is_released" boolean DEFAULT false,
	"released_at" timestamp (6) with time zone,
	"name" varchar(256) NOT NULL,
	"description" varchar(2048) NOT NULL,
	"number_of_visits" integer DEFAULT 0,
	"number_of_likes" integer DEFAULT 0,
	"numberOfDislikes" integer DEFAULT 0,
	"channel_id" integer NOT NULL,
	"duration" integer,
	"thumbnail_file_id" integer,
	"processing_status" "video_proccessing_status"
);
--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "deleted_at" timestamp (6) with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "videos_channel_id_idx" ON "videos" ("channel_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_thumbnail_file_id_files_id_fk" FOREIGN KEY ("thumbnail_file_id") REFERENCES "files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
