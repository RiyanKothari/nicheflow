import { Router } from "express";
import { db, bookingsTable, businessesTable, clientsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function getBusinessId(userId: number): Promise<number | null> {
  const [b] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return b?.id ?? null;
}

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) {
      res.json([]);
      return;
    }

    const { status, clientId } = req.query;
    let conditions = [eq(bookingsTable.businessId, businessId)];
    if (status) conditions.push(sql`bookings.status = ${status}`);
    if (clientId) conditions.push(eq(bookingsTable.clientId, parseInt(clientId as string)));

    const bookings = await db.select({
      id: bookingsTable.id,
      businessId: bookingsTable.businessId,
      clientId: bookingsTable.clientId,
      clientName: clientsTable.name,
      title: bookingsTable.title,
      description: bookingsTable.description,
      status: bookingsTable.status,
      scheduledAt: bookingsTable.scheduledAt,
      duration: bookingsTable.duration,
      amount: bookingsTable.amount,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    }).from(bookingsTable)
      .leftJoin(clientsTable, eq(bookingsTable.clientId, clientsTable.id))
      .where(and(...conditions))
      .orderBy(sql`bookings.scheduled_at DESC`);

    res.json(bookings.map(b => ({ ...b, amount: b.amount ? parseFloat(b.amount) : null })));
  } catch (err) {
    req.log.error({ err }, "Get bookings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) {
      res.status(400).json({ error: "Bad Request", message: "Create a business first" });
      return;
    }

    const { clientId, title, description, status, scheduledAt, duration, amount, notes } = req.body;
    if (!title || !scheduledAt) {
      res.status(400).json({ error: "Bad Request", message: "title and scheduledAt are required" });
      return;
    }

    const [booking] = await db.insert(bookingsTable).values({
      businessId,
      clientId: clientId || null,
      title,
      description,
      status: status || "pending",
      scheduledAt: new Date(scheduledAt),
      duration,
      amount: amount?.toString(),
      notes,
    }).returning();

    res.status(201).json({ ...booking, amount: booking.amount ? parseFloat(booking.amount) : null, clientName: null });
  } catch (err) {
    req.log.error({ err }, "Create booking error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [booking] = await db.select({
      id: bookingsTable.id,
      businessId: bookingsTable.businessId,
      clientId: bookingsTable.clientId,
      clientName: clientsTable.name,
      title: bookingsTable.title,
      description: bookingsTable.description,
      status: bookingsTable.status,
      scheduledAt: bookingsTable.scheduledAt,
      duration: bookingsTable.duration,
      amount: bookingsTable.amount,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    }).from(bookingsTable)
      .leftJoin(clientsTable, eq(bookingsTable.clientId, clientsTable.id))
      .where(and(eq(bookingsTable.id, id), eq(bookingsTable.businessId, businessId!))).limit(1);

    if (!booking) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({ ...booking, amount: booking.amount ? parseFloat(booking.amount) : null });
  } catch (err) {
    req.log.error({ err }, "Get booking error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(bookingsTable).where(and(eq(bookingsTable.id, id), eq(bookingsTable.businessId, businessId!))).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Not Found" });
      return;
    }

    const { clientId, title, description, status, scheduledAt, duration, amount, notes } = req.body;
    const [updated] = await db.update(bookingsTable).set({
      clientId: clientId !== undefined ? clientId : existing.clientId,
      title: title ?? existing.title,
      description: description ?? existing.description,
      status: status ?? existing.status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : existing.scheduledAt,
      duration: duration ?? existing.duration,
      amount: amount !== undefined ? amount.toString() : existing.amount,
      notes: notes ?? existing.notes,
      updatedAt: new Date(),
    }).where(eq(bookingsTable.id, id)).returning();

    res.json({ ...updated, amount: updated.amount ? parseFloat(updated.amount) : null, clientName: null });
  } catch (err) {
    req.log.error({ err }, "Update booking error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/:id/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "status is required" }); return; }
    const [existing] = await db.select().from(bookingsTable).where(and(eq(bookingsTable.id, id), eq(bookingsTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }
    const [updated] = await db.update(bookingsTable).set({ status, updatedAt: new Date() }).where(eq(bookingsTable.id, id)).returning();
    res.json({ ...updated, amount: updated.amount ? parseFloat(updated.amount) : null });
  } catch (err) {
    req.log.error({ err }, "Patch booking status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    await db.delete(bookingsTable).where(and(eq(bookingsTable.id, id), eq(bookingsTable.businessId, businessId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete booking error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
