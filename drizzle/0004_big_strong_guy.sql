ALTER TABLE "channels" ALTER COLUMN "description" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "channels" ALTER COLUMN "description" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "channels" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "channels" ADD COLUMN "avatar" varchar(2048) DEFAULT 'avatar-default.png';