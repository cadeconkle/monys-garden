CREATE TABLE "lock_screen_subscriptions" (
	"endpoint" text PRIMARY KEY,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"gardener_email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
