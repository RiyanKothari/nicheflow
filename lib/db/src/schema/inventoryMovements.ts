import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { businessesTable } from "./businesses";
import { inventoryTable } from "./inventory";

export const inventoryMovementsTable = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull().references(() => businessesTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => inventoryTable.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // "add" | "deduct" | "adjust"
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type InventoryMovement = typeof inventoryMovementsTable.$inferSelect;
