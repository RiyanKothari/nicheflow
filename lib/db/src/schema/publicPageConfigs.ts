import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { businessesTable } from "./businesses";

export const publicPageConfigsTable = pgTable("public_page_configs", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }).unique(),
  tagline: text("tagline"),
  coverPhotoUrl: text("cover_photo_url"),
  aboutText: text("about_text"),
  showAbout: boolean("show_about").notNull().default(true),
  services: jsonb("services").notNull().default([]),
  showServices: boolean("show_services").notNull().default(true),
  showContact: boolean("show_contact").notNull().default(true),
  showReviews: boolean("show_reviews").notNull().default(true),
  showBookingWidget: boolean("show_booking_widget").notNull().default(true),
  accentColor: text("accent_color").notNull().default("#7c3aed"),
  socialInstagram: text("social_instagram"),
  socialFacebook: text("social_facebook"),
  socialYoutube: text("social_youtube"),
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(true),
  mapsLink: text("maps_link"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPublicPageConfigSchema = createInsertSchema(publicPageConfigsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type InsertPublicPageConfig = z.infer<typeof insertPublicPageConfigSchema>;
export type PublicPageConfig = typeof publicPageConfigsTable.$inferSelect;
