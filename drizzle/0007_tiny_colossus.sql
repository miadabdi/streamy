ALTER TABLE "videos" ADD COLUMN "video_id" varchar(20);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "videos_video_id_idx" ON "videos" ("video_id");