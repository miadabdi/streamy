DO $$ BEGIN
 CREATE TYPE "playlist_privacy" AS ENUM('private', 'public');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "playlist_type" AS ENUM('likes', 'dislikes', 'watched', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"deleted_at" timestamp (6) with time zone,
	"name" varchar(256) NOT NULL,
	"description" varchar(2048) NOT NULL,
	"channel_id" integer,
	"privacy" "playlist_privacy" DEFAULT 'private',
	"type" "playlist_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playlists_videos" (
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"playlist_id" integer,
	"video_id" integer,
	CONSTRAINT "playlists_videos_pk" PRIMARY KEY("video_id","playlist_id")
);
--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "processing_status" SET DEFAULT 'ready_for_upload';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlists" ADD CONSTRAINT "playlists_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlists_videos" ADD CONSTRAINT "playlists_videos_playlist_id_playlists_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "playlists_videos" ADD CONSTRAINT "playlists_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
