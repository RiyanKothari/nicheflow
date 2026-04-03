import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const publicPageReviewsTable = pgTable("public_page_reviews", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  rating: integer("rating").notNull().default(5),
  comment: text("comment"),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPublicPageReviewSchema = createInsertSchema(publicPageReviewsTable).omit({
  id: true, createdAt: true,
});

export type InsertPublicPageReview = z.infer<typeof insertPublicPageReviewSchema>;
export type PublicPageReview = typeof publicPageReviewsTable.$inferSelect;
