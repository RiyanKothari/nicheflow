import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { clientsTable } from "./clients";

export const clientNotesTable = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ClientNote = typeof clientNotesTable.$inferSelect;
