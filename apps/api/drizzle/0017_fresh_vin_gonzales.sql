DO $$ BEGIN
 CREATE TYPE "video_type" AS ENUM('vod', 'live');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "type" "video_type" DEFAULT 'vod';