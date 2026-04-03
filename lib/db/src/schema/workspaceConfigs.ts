import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const workspaceConfigsTable = pgTable("workspace_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }).unique(),
  niche: text("niche").notNull(),
  nicheEmoji: text("niche_emoji").default("🏪"),
  businessName: text("business_name").notNull(),
  modules: jsonb("modules").notNull().default([]),
  terminology: jsonb("terminology").notNull().default({}),
  services: jsonb("services").notNull().default([]),
  customClientFields: jsonb("custom_client_fields").notNull().default([]),
  customBookingFields: jsonb("custom_booking_fields").notNull().default([]),
  customInventoryFields: jsonb("custom_inventory_fields").notNull().default([]),
  kanbanColumns: jsonb("kanban_columns").notNull().default([]),
  inventoryCategories: jsonb("inventory_categories").notNull().default([]),
  inventoryUnits: jsonb("inventory_units").notNull().default([]),
  dashboardMetric: text("dashboard_metric").default("Bookings today"),
  nextActionTemplates: jsonb("next_action_templates").notNull().default([]),
  greeting: text("greeting"),
  sampleData: jsonb("sample_data").notNull().default({}),
  suggestedTagline: text("suggested_tagline"),
  color: text("color").notNull().default("purple"),
  isCompleted: boolean("is_completed").notNull().default(false),
  language: text("language").notNull().default("en"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkspaceConfigSchema = createInsertSchema(workspaceConfigsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkspaceConfig = z.infer<typeof insertWorkspaceConfigSchema>;
export type WorkspaceConfig = typeof workspaceConfigsTable.$inferSelect;
