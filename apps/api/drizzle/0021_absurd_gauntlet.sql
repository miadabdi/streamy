ALTER TABLE "videos" ADD COLUMN "disconnected_at" timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "live_started_at" timestamp (6) with time zone;