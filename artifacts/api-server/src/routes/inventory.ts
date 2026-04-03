import { Router } from "express";
import { db, inventoryTable, inventoryMovementsTable, businessesTable } from "@workspace/db";
import { eq, and, sql, ilike, or, desc, lt, gte } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function getBusinessId(userId: number): Promise<number | null> {
  const [b] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return b?.id ?? null;
}

function mapItem(item: any) {
  const qty = parseFloat(item.quantity);
  const threshold = item.lowStockThreshold ? parseFloat(item.lowStockThreshold) : null;
  const status = qty === 0 ? "out_of_stock" : (threshold !== null && qty <= threshold ? "low_stock" : "healthy");
  return {
    ...item,
    quantity: qty,
    lowStockThreshold: threshold,
    costPrice: item.costPrice ? parseFloat(item.costPrice) : null,
    sellingPrice: item.sellingPrice ? parseFloat(item.sellingPrice) : null,
    totalValue: item.costPrice ? qty * parseFloat(item.costPrice) : 0,
    status,
  };
}

function mapMovement(m: any) {
  return { ...m, quantity: parseFloat(m.quantity), balanceAfter: parseFloat(m.balanceAfter) };
}

// ── Alerts (low stock) ──────────────────────────────────────────────────────

router.get("/alerts", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json([]); return; }
    const items = await db.select().from(inventoryTable)
      .where(and(
        eq(inventoryTable.businessId, businessId),
        sql`low_stock_threshold IS NOT NULL`,
        sql`quantity::numeric <= low_stock_threshold::numeric`,
      )).orderBy(sql`quantity::numeric ASC`);
    res.json(items.map(mapItem));
  } catch (err) {
    req.log.error({ err }, "Get inventory alerts error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Stats ────────────────────────────────────────────────────────────────────

router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json({ total: 0, totalValue: 0, lowStock: 0, outOfStock: 0 }); return; }

    const items = await db.select().from(inventoryTable).where(eq(inventoryTable.businessId, businessId));
    const mapped = items.map(mapItem);
    const totalValue = mapped.reduce((s, i) => s + i.totalValue, 0);
    const lowStock   = mapped.filter(i => i.status === "low_stock").length;
    const outOfStock = mapped.filter(i => i.status === "out_of_stock").length;

    // Categories
    const categories = [...new Set(mapped.map(i => i.category).filter(Boolean))];
    const categoryBreakdown = categories.map(cat => ({
      category: cat,
      count: mapped.filter(i => i.category === cat).length,
      value: mapped.filter(i => i.category === cat).reduce((s, i) => s + i.totalValue, 0),
    }));

    // Most used this month (top movements)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const movements = await db.select({
      itemId: inventoryMovementsTable.itemId,
      total: sql<string>`sum(quantity::numeric)`,
    }).from(inventoryMovementsTable)
      .where(and(
        eq(inventoryMovementsTable.businessId, businessId),
        sql`action = 'deduct'`,
        gte(inventoryMovementsTable.createdAt, monthStart),
      ))
      .groupBy(inventoryMovementsTable.itemId)
      .orderBy(sql`sum(quantity::numeric) DESC`)
      .limit(5);

    const mostUsed = await Promise.all(movements.map(async m => {
      const [item] = await db.select({ name: inventoryTable.name, unit: inventoryTable.unit }).from(inventoryTable).where(eq(inventoryTable.id, m.itemId)).limit(1);
      return { name: item?.name || "Unknown", unit: item?.unit, used: parseFloat(m.total) };
    }));

    res.json({ total: mapped.length, totalValue, lowStock, outOfStock, categoryBreakdown, mostUsed });
  } catch (err) {
    req.log.error({ err }, "Inventory stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── List ─────────────────────────────────────────────────────────────────────

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json([]); return; }

    const { search, category, status } = req.query;
    let conditions: any[] = [eq(inventoryTable.businessId, businessId)];
    if (search) conditions.push(ilike(inventoryTable.name, `%${search}%`));
    if (category) conditions.push(eq(inventoryTable.category, category as string));

    const items = await db.select().from(inventoryTable)
      .where(and(...conditions))
      .orderBy(desc(inventoryTable.updatedAt));

    let result = items.map(mapItem);
    if (status === "low_stock") result = result.filter(i => i.status === "low_stock");
    else if (status === "out_of_stock") result = result.filter(i => i.status === "out_of_stock");
    else if (status === "healthy") result = result.filter(i => i.status === "healthy");

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get inventory error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Create ────────────────────────────────────────────────────────────────────

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(400).json({ error: "Create a business first" }); return; }

    const { name, description, quantity, unit, lowStockThreshold, costPrice, sellingPrice, category, supplier, supplierPhone, restockNotes } = req.body;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const [item] = await db.insert(inventoryTable).values({
      businessId, name, description,
      quantity: (quantity ?? 0).toString(),
      unit, lowStockThreshold: lowStockThreshold?.toString(),
      costPrice: costPrice?.toString(), sellingPrice: sellingPrice?.toString(),
      category, supplier, supplierPhone, restockNotes,
    }).returning();

    // Record initial stock movement if quantity > 0
    if (Number(quantity) > 0) {
      await db.insert(inventoryMovementsTable).values({
        businessId, itemId: item.id, action: "add",
        quantity: quantity.toString(), balanceAfter: quantity.toString(),
        reason: "Initial stock",
      });
    }

    res.status(201).json(mapItem(item));
  } catch (err) {
    req.log.error({ err }, "Create inventory item error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Update ────────────────────────────────────────────────────────────────────

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(inventoryTable).where(and(eq(inventoryTable.id, id), eq(inventoryTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { name, description, quantity, unit, lowStockThreshold, costPrice, sellingPrice, category, supplier, supplierPhone, restockNotes } = req.body;
    const [updated] = await db.update(inventoryTable).set({
      name: name ?? existing.name,
      description: description ?? existing.description,
      quantity: quantity !== undefined ? quantity.toString() : existing.quantity,
      unit: unit ?? existing.unit,
      lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold?.toString() : existing.lowStockThreshold,
      costPrice: costPrice !== undefined ? costPrice?.toString() : existing.costPrice,
      sellingPrice: sellingPrice !== undefined ? sellingPrice?.toString() : existing.sellingPrice,
      category: category ?? existing.category,
      supplier: supplier !== undefined ? supplier : existing.supplier,
      supplierPhone: supplierPhone !== undefined ? supplierPhone : existing.supplierPhone,
      restockNotes: restockNotes !== undefined ? restockNotes : existing.restockNotes,
      updatedAt: new Date(),
    }).where(eq(inventoryTable.id, id)).returning();

    res.json(mapItem(updated));
  } catch (err) {
    req.log.error({ err }, "Update inventory item error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Delete ─────────────────────────────────────────────────────────────────────

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    await db.delete(inventoryMovementsTable).where(eq(inventoryMovementsTable.itemId, id));
    await db.delete(inventoryTable).where(and(eq(inventoryTable.id, id), eq(inventoryTable.businessId, businessId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete inventory item error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Movements ─────────────────────────────────────────────────────────────────

router.get("/:id/movements", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const movements = await db.select().from(inventoryMovementsTable)
      .where(and(eq(inventoryMovementsTable.itemId, id), eq(inventoryMovementsTable.businessId, businessId!)))
      .orderBy(desc(inventoryMovementsTable.createdAt));
    res.json(movements.map(mapMovement));
  } catch (err) {
    req.log.error({ err }, "Get movements error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:id/movement", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(inventoryTable).where(and(eq(inventoryTable.id, id), eq(inventoryTable.businessId, businessId!))).limit(1);
    if (!item) { res.status(404).json({ error: "Not Found" }); return; }

    const { action, quantity, reason } = req.body;
    if (!action || !quantity) { res.status(400).json({ error: "action and quantity are required" }); return; }

    const currentQty = parseFloat(item.quantity as string);
    const delta = parseFloat(quantity);
    let newQty = action === "add" ? currentQty + delta : Math.max(0, currentQty - delta);

    // Update item quantity
    const [updated] = await db.update(inventoryTable)
      .set({ quantity: newQty.toString(), updatedAt: new Date() })
      .where(eq(inventoryTable.id, id)).returning();

    // Record movement
    const [movement] = await db.insert(inventoryMovementsTable).values({
      businessId: businessId!, itemId: id, action,
      quantity: delta.toString(), balanceAfter: newQty.toString(),
      reason,
    }).returning();

    res.json({ item: mapItem(updated), movement: mapMovement(movement) });
  } catch (err) {
    req.log.error({ err }, "Record movement error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
