import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const household = pgTable("household", {
  id: integer().primaryKey(),
  gardenerIdentityId: text("gardener_identity_id").notNull(),
  gardenerEmail: text("gardener_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lockScreenSubscriptions = pgTable("lock_screen_subscriptions", {
  endpoint: text().primaryKey(),
  p256dh: text().notNull(),
  auth: text().notNull(),
  gardenerEmail: text("gardener_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gardenBook = pgTable("garden_book", {
  id: integer().primaryKey(),
  book: text().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
