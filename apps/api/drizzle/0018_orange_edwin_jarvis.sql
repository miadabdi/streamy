ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_follower_id_channels_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_followee_id_channels_id_fk";
