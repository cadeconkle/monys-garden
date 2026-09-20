import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const household = pgTable("household", {
  id: integer().primaryKey(),
  gardenerIdentityId: text("gardener_identity_id").notNull(),
  gardenerEmail: text("gardener_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
