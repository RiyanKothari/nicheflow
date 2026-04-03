import { Router } from "express";
import { db, invoicesTable, businessesTable, clientsTable, bookingsTable } from "@workspace/db";
import { eq, and, sql, ilike, or, desc, gte, lte } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function getBusinessId(userId: number): Promise<number | null> {
  const [b] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return b?.id ?? null;
}

async function getNextInvoiceNumber(businessId: number): Promise<string> {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable).where(eq(invoicesTable.businessId, businessId));
  return `INV-${(result.count + 1).toString().padStart(4, "0")}`;
}

function parseInvoice(i: any) {
  return {
    ...i,
    subtotal:  parseFloat(i.subtotal  || "0"),
    tax:       parseFloat(i.tax       || "0"),
    total:     parseFloat(i.total     || "0"),
    discount:  parseFloat(i.discount  || "0"),
    payments:  (i.payments as any[]) || [],
  };
}

function calcTotals(items: any[], taxPct: number, discount: number, discountType: string) {
  const subtotal = items.reduce((s: number, it: any) => s + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0);
  const discountAmt = discountType === "percent" ? (subtotal * discount) / 100 : discount;
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmt  = (taxable * taxPct) / 100;
  const total   = taxable + taxAmt;
  return { subtotal, discountAmt, taxAmt, total };
}

// ── Public (no auth) ────────────────────────────────────────────────────────

router.get("/public/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [inv] = await db.select({
      id: invoicesTable.id,
      businessId: invoicesTable.businessId,
      clientId: invoicesTable.clientId,
      clientName: clientsTable.name,
      invoiceNumber: invoicesTable.invoiceNumber,
      status: invoicesTable.status,
      items: invoicesTable.items,
      subtotal: invoicesTable.subtotal,
      tax: invoicesTable.tax,
      total: invoicesTable.total,
      discount: invoicesTable.discount,
      discountType: invoicesTable.discountType,
      issuedAt: invoicesTable.issuedAt,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      payments: invoicesTable.payments,
      notes: invoicesTable.notes,
      createdAt: invoicesTable.createdAt,
    }).from(invoicesTable)
      .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
      .where(eq(invoicesTable.id, id)).limit(1);

    if (!inv) { res.status(404).json({ error: "Not Found" }); return; }

    // Get business info
    const [biz] = await db.select({
      name: businessesTable.name, phone: businessesTable.phone,
      email: businessesTable.email, address: businessesTable.address, city: businessesTable.city,
    }).from(businessesTable).where(eq(businessesTable.id, inv.businessId)).limit(1);

    res.json({ ...parseInvoice(inv), business: biz || null });
  } catch (err) { res.status(500).json({ error: "Internal Server Error" }); }
});

// ── Stats ────────────────────────────────────────────────────────────────────

router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json({ revenueThisMonth: 0, outstanding: 0, paidThisMonth: 0, overdueCount: 0 }); return; }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [rev] = await db.select({ v: sql<string>`COALESCE(sum(total::numeric),0)` }).from(invoicesTable)
      .where(and(eq(invoicesTable.businessId, businessId), sql`status = 'paid'`, gte(invoicesTable.paidAt, monthStart)));
    const [out] = await db.select({ v: sql<string>`COALESCE(sum(total::numeric),0)` }).from(invoicesTable)
      .where(and(eq(invoicesTable.businessId, businessId), sql`status IN ('sent','pending','overdue')`));
    const [paidMo] = await db.select({ v: sql<number>`count(*)::int` }).from(invoicesTable)
      .where(and(eq(invoicesTable.businessId, businessId), sql`status = 'paid'`, gte(invoicesTable.paidAt, monthStart)));
    const [overdue] = await db.select({ v: sql<number>`count(*)::int` }).from(invoicesTable)
      .where(and(eq(invoicesTable.businessId, businessId), sql`status = 'overdue'`));

    // Monthly revenue (last 6 months)
    const monthly = await db.select({
      month: sql<string>`to_char(created_at, 'Mon')`,
      revenue: sql<string>`COALESCE(sum(total::numeric) FILTER (WHERE status='paid'),0)`,
    }).from(invoicesTable)
      .where(and(eq(invoicesTable.businessId, businessId), gte(invoicesTable.createdAt, new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000))))
      .groupBy(sql`date_trunc('month', created_at), to_char(created_at, 'Mon')`)
      .orderBy(sql`date_trunc('month', created_at)`);

    res.json({
      revenueThisMonth: parseFloat(rev.v),
      outstanding: parseFloat(out.v),
      paidThisMonth: paidMo.v,
      overdueCount: overdue.v,
      monthlyRevenue: monthly.map(m => ({ month: m.month, revenue: parseFloat(m.revenue) })),
    });
  } catch (err) {
    req.log.error({ err }, "Invoice stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── List ─────────────────────────────────────────────────────────────────────

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json([]); return; }

    const { status, search, from, to } = req.query;
    let conditions: any[] = [eq(invoicesTable.businessId, businessId)];
    if (status && status !== "all") conditions.push(sql`invoices.status = ${status}`);
    if (from) conditions.push(gte(invoicesTable.createdAt, new Date(from as string)));
    if (to)   conditions.push(lte(invoicesTable.createdAt, new Date(to as string)));

    const invoices = await db.select({
      id: invoicesTable.id,
      clientId: invoicesTable.clientId,
      clientName: clientsTable.name,
      invoiceNumber: invoicesTable.invoiceNumber,
      status: invoicesTable.status,
      items: invoicesTable.items,
      subtotal: invoicesTable.subtotal,
      tax: invoicesTable.tax,
      total: invoicesTable.total,
      discount: invoicesTable.discount,
      discountType: invoicesTable.discountType,
      issuedAt: invoicesTable.issuedAt,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      payments: invoicesTable.payments,
      notes: invoicesTable.notes,
      createdAt: invoicesTable.createdAt,
    }).from(invoicesTable)
      .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
      .where(and(...conditions))
      .orderBy(desc(invoicesTable.createdAt));

    let result = invoices.map(parseInvoice);
    if (search) {
      const q = (search as string).toLowerCase();
      result = result.filter(i => i.invoiceNumber.toLowerCase().includes(q) || (i.clientName || "").toLowerCase().includes(q));
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get invoices error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Create ────────────────────────────────────────────────────────────────────

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(400).json({ error: "Create a business first" }); return; }

    const { clientId, items, taxPct = 0, discount = 0, discountType = "fixed", dueDate, notes, status, invoiceNumber: customNum, issuedAt } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "items array is required" }); return;
    }

    const { subtotal, taxAmt, total } = calcTotals(items, Number(taxPct), Number(discount), discountType);
    const invoiceNumber = customNum || await getNextInvoiceNumber(businessId);

    const [invoice] = await db.insert(invoicesTable).values({
      businessId, clientId: clientId || null, invoiceNumber,
      status: status || "draft", items,
      subtotal: subtotal.toString(), tax: taxAmt.toString(), total: total.toString(),
      discount: discount.toString(), discountType,
      issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      notes,
    }).returning();

    res.status(201).json({ ...parseInvoice(invoice), clientName: null });
  } catch (err) {
    req.log.error({ err }, "Create invoice error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Single ────────────────────────────────────────────────────────────────────

router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [inv] = await db.select({
      id: invoicesTable.id,
      businessId: invoicesTable.businessId,
      clientId: invoicesTable.clientId,
      clientName: clientsTable.name,
      clientPhone: clientsTable.phone,
      clientEmail: clientsTable.email,
      clientAddress: clientsTable.address,
      invoiceNumber: invoicesTable.invoiceNumber,
      status: invoicesTable.status,
      items: invoicesTable.items,
      subtotal: invoicesTable.subtotal,
      tax: invoicesTable.tax,
      total: invoicesTable.total,
      discount: invoicesTable.discount,
      discountType: invoicesTable.discountType,
      issuedAt: invoicesTable.issuedAt,
      dueDate: invoicesTable.dueDate,
      paidAt: invoicesTable.paidAt,
      payments: invoicesTable.payments,
      notes: invoicesTable.notes,
      createdAt: invoicesTable.createdAt,
    }).from(invoicesTable)
      .leftJoin(clientsTable, eq(invoicesTable.clientId, clientsTable.id))
      .where(and(eq(invoicesTable.id, id), eq(invoicesTable.businessId, businessId!))).limit(1);

    if (!inv) { res.status(404).json({ error: "Not Found" }); return; }

    const [biz] = await db.select({
      name: businessesTable.name, phone: businessesTable.phone,
      email: businessesTable.email, address: businessesTable.address, city: businessesTable.city,
    }).from(businessesTable).where(eq(businessesTable.id, businessId!)).limit(1);

    res.json({ ...parseInvoice(inv), business: biz || null });
  } catch (err) {
    req.log.error({ err }, "Get invoice error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Update ────────────────────────────────────────────────────────────────────

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { clientId, items, taxPct, discount, discountType, dueDate, notes, status, issuedAt } = req.body;
    const useItems = items || existing.items;
    const useTax = taxPct !== undefined ? Number(taxPct) : 0;
    const useDiscount = discount !== undefined ? Number(discount) : parseFloat(existing.discount);
    const useDiscountType = discountType || existing.discountType;
    const { subtotal, taxAmt, total } = calcTotals(useItems as any[], useTax, useDiscount, useDiscountType);

    const [updated] = await db.update(invoicesTable).set({
      clientId: clientId !== undefined ? clientId : existing.clientId,
      items: useItems,
      subtotal: subtotal.toString(), tax: taxAmt.toString(), total: total.toString(),
      discount: useDiscount.toString(), discountType: useDiscountType,
      issuedAt: issuedAt ? new Date(issuedAt) : existing.issuedAt,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
      notes: notes !== undefined ? notes : existing.notes,
      status: status ?? existing.status,
      updatedAt: new Date(),
    }).where(eq(invoicesTable.id, id)).returning();

    res.json({ ...parseInvoice(updated), clientName: null });
  } catch (err) {
    req.log.error({ err }, "Update invoice error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Patch status ───────────────────────────────────────────────────────────────

router.patch("/:id/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "status is required" }); return; }
    const [existing] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }
    const [updated] = await db.update(invoicesTable).set({ status, updatedAt: new Date() }).where(eq(invoicesTable.id, id)).returning();
    res.json(parseInvoice(updated));
  } catch (err) {
    req.log.error({ err }, "Patch invoice status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Record payment ─────────────────────────────────────────────────────────────

router.post("/:id/payment", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { amount, method, date, note } = req.body;
    if (!amount || !method) { res.status(400).json({ error: "amount and method are required" }); return; }

    const existingPayments = (existing.payments as any[]) || [];
    const newPayment = { id: Date.now(), amount: Number(amount), method, date: date || new Date().toISOString(), note };
    const allPayments = [...existingPayments, newPayment];
    const paidSum = allPayments.reduce((s: number, p: any) => s + p.amount, 0);
    const totalAmt = parseFloat(existing.total);
    const newStatus = paidSum >= totalAmt ? "paid" : existing.status;
    const paidAt = paidSum >= totalAmt ? new Date() : (existing.paidAt || null);

    const [updated] = await db.update(invoicesTable).set({
      payments: allPayments, status: newStatus, paidAt, updatedAt: new Date(),
    }).where(eq(invoicesTable.id, id)).returning();

    res.json(parseInvoice(updated));
  } catch (err) {
    req.log.error({ err }, "Record payment error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Delete ─────────────────────────────────────────────────────────────────────

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    await db.delete(invoicesTable).where(and(eq(invoicesTable.id, id), eq(invoicesTable.businessId, businessId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete invoice error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
