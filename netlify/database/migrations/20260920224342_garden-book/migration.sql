CREATE TABLE "garden_book" (
	"id" integer PRIMARY KEY,
	"book" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
