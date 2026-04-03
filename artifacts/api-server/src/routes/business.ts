import { Router } from "express";
import { db, businessesTable, clientsTable, bookingsTable, invoicesTable, inventoryTable, tasksTable } from "@workspace/db";
import { eq, and, sql, lt, gte, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function getBusinessForUser(userId: number) {
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return business;
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const business = await getBusinessForUser(req.userId!);
    if (!business) {
      res.status(404).json({ error: "Not Found", message: "Business not found" });
      return;
    }
    res.json(business);
  } catch (err) {
    req.log.error({ err }, "Get business error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const existing = await getBusinessForUser(req.userId!);
    if (existing) {
      res.status(400).json({ error: "Bad Request", message: "Business already exists" });
      return;
    }

    const { name, description, category, phone, email, address, city, currency } = req.body;

    if (!name || !category) {
      res.status(400).json({ error: "Bad Request", message: "name and category are required" });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);

    const [business] = await db.insert(businessesTable).values({
      userId: req.userId!,
      name,
      description,
      category,
      phone,
      email,
      address,
      city,
      slug,
      currency: currency || "INR",
    }).returning();

    res.status(201).json(business);
  } catch (err) {
    req.log.error({ err }, "Create business error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const business = await getBusinessForUser(req.userId!);
    if (!business) {
      res.status(404).json({ error: "Not Found", message: "Business not found" });
      return;
    }

    const { name, description, category, phone, email, address, city, currency, logoUrl } = req.body;

    const [updated] = await db.update(businessesTable).set({
      name: name ?? business.name,
      description: description ?? business.description,
      category: category ?? business.category,
      phone: phone ?? business.phone,
      email: email ?? business.email,
      address: address ?? business.address,
      city: city ?? business.city,
      currency: currency ?? business.currency,
      logoUrl: logoUrl ?? business.logoUrl,
      updatedAt: new Date(),
    }).where(eq(businessesTable.id, business.id)).returning();

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update business error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const business = await getBusinessForUser(req.userId!);
    if (!business) {
      res.json({
        totalClients: 0,
        totalRevenue: 0,
        activeBookings: 0,
        todayBookings: 0,
        pendingInvoices: 0,
        pendingInvoicesAmount: 0,
        overdueTasks: 0,
        lowStockItems: 0,
        pendingTasks: 0,
        revenueByMonth: [],
        revenueLast7Days: [],
        recentBookings: [],
        recentActivity: [],
      });
      return;
    }

    const bId = business.id;

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);

    const [clientCount]   = await db.select({ count: sql<number>`count(*)::int` }).from(clientsTable).where(eq(clientsTable.businessId, bId));
    const [activeBookings] = await db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable).where(and(eq(bookingsTable.businessId, bId), sql`status IN ('pending','confirmed')`));
    const [todayBookings]  = await db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable).where(and(eq(bookingsTable.businessId, bId), gte(bookingsTable.scheduledAt, todayStart), lt(bookingsTable.scheduledAt, todayEnd)));
    const [pendingInvoices] = await db.select({ count: sql<number>`count(*)::int` }).from(invoicesTable).where(and(eq(invoicesTable.businessId, bId), sql`status IN ('sent','overdue')`));
    const [pendingInvAmt]  = await db.select({ total: sql<string>`COALESCE(sum(total::numeric), 0)` }).from(invoicesTable).where(and(eq(invoicesTable.businessId, bId), sql`status IN ('sent','overdue')`));
    const [pendingTasks]   = await db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.businessId, bId), sql`status IN ('todo','in_progress')`));
    const [overdueTasks]   = await db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.businessId, bId), sql`status = 'todo' AND due_date IS NOT NULL AND due_date < now()`));

    const [revenueResult]  = await db.select({ total: sql<string>`COALESCE(sum(total::numeric), 0)` }).from(invoicesTable).where(and(eq(invoicesTable.businessId, bId), sql`status = 'paid'`));
    const totalRevenue = parseFloat(revenueResult?.total ?? "0");

    const lowStockItems = await db.select().from(inventoryTable).where(and(eq(inventoryTable.businessId, bId), sql`low_stock_threshold IS NOT NULL AND quantity::numeric <= low_stock_threshold::numeric`));

    const recentBookings = await db.select().from(bookingsTable).where(eq(bookingsTable.businessId, bId)).orderBy(sql`created_at DESC`).limit(5);

    const revenueRows = await db.select({
      month: sql<string>`to_char(created_at, 'Mon')`,
      revenue: sql<string>`COALESCE(sum(total::numeric), 0)`,
    }).from(invoicesTable).where(and(eq(invoicesTable.businessId, bId), sql`status = 'paid' AND created_at >= now() - interval '6 months'`)).groupBy(sql`to_char(created_at, 'Mon'), date_trunc('month', created_at)`).orderBy(sql`date_trunc('month', created_at)`);

    const revenueLast7 = await db.select({
      day: sql<string>`to_char(created_at, 'DD Mon')`,
      revenue: sql<string>`COALESCE(sum(total::numeric), 0)`,
    }).from(invoicesTable).where(and(eq(invoicesTable.businessId, bId), sql`status = 'paid' AND created_at >= now() - interval '7 days'`)).groupBy(sql`to_char(created_at, 'DD Mon'), date_trunc('day', created_at)`).orderBy(sql`date_trunc('day', created_at)`);

    // Recent activity: combine recent bookings + recent clients
    const recentClients = await db.select().from(clientsTable).where(eq(clientsTable.businessId, bId)).orderBy(sql`created_at DESC`).limit(5);
    const recentActivity = [
      ...recentBookings.map(b => ({ type: "booking", text: `Booking: ${b.title}`, time: b.createdAt })),
      ...recentClients.map(c => ({ type: "client", text: `Client added: ${c.name}`, time: c.createdAt })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    res.json({
      totalClients: clientCount.count,
      totalRevenue,
      activeBookings: activeBookings.count,
      todayBookings: todayBookings.count,
      pendingInvoices: pendingInvoices.count,
      pendingInvoicesAmount: parseFloat(pendingInvAmt?.total ?? "0"),
      overdueTasks: overdueTasks.count,
      lowStockItems: lowStockItems.length,
      pendingTasks: pendingTasks.count,
      revenueByMonth: revenueRows.map(r => ({ month: r.month, revenue: parseFloat(r.revenue) })),
      revenueLast7Days: revenueLast7.map(r => ({ day: r.day, revenue: parseFloat(r.revenue) })),
      recentBookings,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Get dashboard stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/public/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const [business] = await db.select().from(businessesTable).where(eq(businessesTable.slug, slug)).limit(1);
    if (!business) {
      res.status(404).json({ error: "Not Found", message: "Business not found" });
      return;
    }
    res.json({ business, services: [] });
  } catch (err) {
    req.log.error({ err }, "Get public page error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
