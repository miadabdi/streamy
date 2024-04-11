ALTER TABLE "channels" ADD COLUMN "avatar_file_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channels" ADD CONSTRAINT "channels_avatar_file_id_files_id_fk" FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "channels" DROP COLUMN IF EXISTS "avatar";