ALTER TABLE "files" ALTER COLUMN "path" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "mimetype" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "size_in_byte" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "video_file_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_video_file_id_files_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
