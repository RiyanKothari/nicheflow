import { Router } from "express";
import { db, clientsTable, businessesTable, invoicesTable, bookingsTable, clientNotesTable } from "@workspace/db";
import { eq, and, sql, ilike, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function getBusinessId(userId: number): Promise<number | null> {
  const [b] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return b?.id ?? null;
}

// ── List ───────────────────────────────────────────────────────────────────────

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json([]); return; }

    const { search, tag, sort } = req.query;
    const where = search
      ? and(eq(clientsTable.businessId, businessId), ilike(clientsTable.name, `%${search}%`))
      : eq(clientsTable.businessId, businessId);

    let orderBy: any = desc(clientsTable.createdAt);
    if (sort === "name")        orderBy = clientsTable.name;
    if (sort === "totalSpent")  orderBy = sql`total_spent DESC`;

    const clients = await db.select({
      id: clientsTable.id,
      businessId: clientsTable.businessId,
      name: clientsTable.name,
      email: clientsTable.email,
      phone: clientsTable.phone,
      address: clientsTable.address,
      notes: clientsTable.notes,
      tags: clientsTable.tags,
      customFields: clientsTable.customFields,
      createdAt: clientsTable.createdAt,
      totalSpent: sql<string>`COALESCE((SELECT sum(i.total::numeric) FROM invoices i WHERE i.client_id = clients.id AND i.status = 'paid'), 0)`,
      bookingsCount: sql<number>`(SELECT count(*) FROM bookings b WHERE b.client_id = clients.id)::int`,
      lastBookingAt: sql<string | null>`(SELECT max(b.scheduled_at) FROM bookings b WHERE b.client_id = clients.id)`,
    }).from(clientsTable).where(where).orderBy(orderBy);

    let result = clients.map(c => ({ ...c, totalSpent: parseFloat(c.totalSpent), tags: (c.tags as string[]) || [] }));
    if (tag && tag !== "all") {
      result = result.filter(c => (c.tags as string[]).includes(tag as string));
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Get clients error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Stats ──────────────────────────────────────────────────────────────────────

router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json({ total: 0, newThisMonth: 0, active: 0, inactive: 0 }); return; }

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(clientsTable).where(eq(clientsTable.businessId, businessId));
    const [{ newThisMonth }] = await db.select({ newThisMonth: sql<number>`count(*)::int` }).from(clientsTable).where(and(eq(clientsTable.businessId, businessId), sql`clients.created_at > now() - interval '30 days'`));
    const [{ active }] = await db.select({ active: sql<number>`count(distinct b.client_id)::int` }).from(clientsTable).leftJoin(bookingsTable, and(eq(bookingsTable.clientId, clientsTable.id), sql`b.scheduled_at > now() - interval '60 days'`)).where(eq(clientsTable.businessId, businessId));

    res.json({ total, newThisMonth, active: active || 0, inactive: (total - (active || 0)) });
  } catch (err) {
    req.log.error({ err }, "Client stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Top clients by revenue ──────────────────────────────────────────────────────

router.get("/top-revenue", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json([]); return; }

    const top = await db.select({
      id: clientsTable.id,
      name: clientsTable.name,
      totalSpent: sql<string>`COALESCE(sum(i.total::numeric), 0) as total_spent`,
    }).from(clientsTable)
      .leftJoin(invoicesTable, and(eq(invoicesTable.clientId, clientsTable.id), sql`invoices.status = 'paid'`))
      .where(eq(clientsTable.businessId, businessId))
      .groupBy(clientsTable.id, clientsTable.name)
      .orderBy(sql`total_spent DESC`)
      .limit(5);

    res.json(top.map(c => ({ ...c, totalSpent: parseFloat(c.totalSpent) })));
  } catch (err) {
    req.log.error({ err }, "Top revenue error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Create ─────────────────────────────────────────────────────────────────────

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(400).json({ error: "Create a business first" }); return; }

    const { name, email, phone, address, notes } = req.body;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const [client] = await db.insert(clientsTable).values({ businessId, name, email, phone, address, notes }).returning();
    res.status(201).json({ ...client, totalSpent: 0, bookingsCount: 0, tags: [], customFields: {} });
  } catch (err) {
    req.log.error({ err }, "Create client error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Full profile ───────────────────────────────────────────────────────────────

router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);

    const [client] = await db.select({
      id: clientsTable.id,
      businessId: clientsTable.businessId,
      name: clientsTable.name,
      email: clientsTable.email,
      phone: clientsTable.phone,
      address: clientsTable.address,
      notes: clientsTable.notes,
      tags: clientsTable.tags,
      customFields: clientsTable.customFields,
      createdAt: clientsTable.createdAt,
      updatedAt: clientsTable.updatedAt,
      totalSpent: sql<string>`COALESCE((SELECT sum(i.total::numeric) FROM invoices i WHERE i.client_id = clients.id AND i.status = 'paid'), 0)`,
      bookingsCount: sql<number>`(SELECT count(*) FROM bookings b WHERE b.client_id = clients.id)::int`,
      lastBookingAt: sql<string | null>`(SELECT max(b.scheduled_at) FROM bookings b WHERE b.client_id = clients.id)`,
    }).from(clientsTable).where(and(eq(clientsTable.id, id), eq(clientsTable.businessId, businessId!))).limit(1);

    if (!client) { res.status(404).json({ error: "Not Found" }); return; }

    // Booking history
    const bkgs = await db.select({
      id: bookingsTable.id,
      title: bookingsTable.title,
      status: bookingsTable.status,
      scheduledAt: bookingsTable.scheduledAt,
      amount: bookingsTable.amount,
      duration: bookingsTable.duration,
    }).from(bookingsTable).where(eq(bookingsTable.clientId, id)).orderBy(desc(bookingsTable.scheduledAt)).limit(30);

    // Invoice history
    const invs = await db.select({
      id: invoicesTable.id,
      invoiceNumber: invoicesTable.invoiceNumber,
      status: invoicesTable.status,
      total: invoicesTable.total,
      dueDate: invoicesTable.dueDate,
      createdAt: invoicesTable.createdAt,
    }).from(invoicesTable).where(eq(invoicesTable.clientId, id)).orderBy(desc(invoicesTable.createdAt)).limit(30);

    // Notes
    const notes = await db.select().from(clientNotesTable).where(eq(clientNotesTable.clientId, id)).orderBy(desc(clientNotesTable.createdAt));

    res.json({
      ...client,
      totalSpent: parseFloat(client.totalSpent),
      tags: (client.tags as string[]) || [],
      customFields: (client.customFields as Record<string, string>) || {},
      bookings: bkgs.map(b => ({ ...b, amount: b.amount ? parseFloat(b.amount) : null })),
      invoices: invs.map(i => ({ ...i, total: parseFloat(i.total) })),
      clientNotes: notes,
    });
  } catch (err) {
    req.log.error({ err }, "Get client error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Update ─────────────────────────────────────────────────────────────────────

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(clientsTable).where(and(eq(clientsTable.id, id), eq(clientsTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { name, email, phone, address, notes, tags, customFields } = req.body;
    const [updated] = await db.update(clientsTable).set({
      name: name ?? existing.name,
      email: email ?? existing.email,
      phone: phone ?? existing.phone,
      address: address ?? existing.address,
      notes: notes ?? existing.notes,
      tags: tags !== undefined ? tags : existing.tags,
      customFields: customFields !== undefined ? customFields : existing.customFields,
      updatedAt: new Date(),
    }).where(eq(clientsTable.id, id)).returning();

    res.json({ ...updated, totalSpent: 0, bookingsCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Update client error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Delete ─────────────────────────────────────────────────────────────────────

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    await db.delete(clientsTable).where(and(eq(clientsTable.id, id), eq(clientsTable.businessId, businessId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete client error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Notes ──────────────────────────────────────────────────────────────────────

router.post("/:id/notes", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const clientId = parseInt(req.params.id);
    const [existing] = await db.select().from(clientsTable).where(and(eq(clientsTable.id, clientId), eq(clientsTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

    const [note] = await db.insert(clientNotesTable).values({ businessId: businessId!, clientId, content: content.trim() }).returning();
    res.status(201).json(note);
  } catch (err) {
    req.log.error({ err }, "Add client note error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id/notes/:noteId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const noteId = parseInt(req.params.noteId);
    await db.delete(clientNotesTable).where(and(eq(clientNotesTable.id, noteId), eq(clientNotesTable.businessId, businessId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete client note error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
