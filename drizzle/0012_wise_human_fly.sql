CREATE TABLE IF NOT EXISTS "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"deleted_at" timestamp (6) with time zone,
	"title" varchar(128) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags_videos" (
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"tag_id" integer,
	"video_id" integer,
	CONSTRAINT "tags_videos_pk" PRIMARY KEY("video_id","tag_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tags_title_idx" ON "tags" ("title");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags_videos" ADD CONSTRAINT "tags_videos_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tags_videos" ADD CONSTRAINT "tags_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
