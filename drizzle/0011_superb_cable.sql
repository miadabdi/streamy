ALTER TABLE "playlists" ALTER COLUMN "type" SET DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE "playlists" ALTER COLUMN "type" DROP NOT NULL;