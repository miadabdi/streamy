CREATE TABLE IF NOT EXISTS "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (6) with time zone DEFAULT now(),
	"updated_at" timestamp (6) with time zone DEFAULT now(),
	"bucket_name" varchar(100) NOT NULL,
	"path" text NOT NULL,
	"mimetype" varchar(50) NOT NULL,
	"size_in_byte" integer NOT NULL
);
