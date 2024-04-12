DROP INDEX IF EXISTS "videos_channel_id_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "videos_channel_id_idx" ON "videos" ("channel_id");