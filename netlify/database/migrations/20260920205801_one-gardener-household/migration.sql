CREATE TABLE "household" (
	"id" integer PRIMARY KEY,
	"gardener_identity_id" text NOT NULL,
	"gardener_email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
