import { Router } from "express";
import { db, businessesTable, bookingsTable, invoicesTable, inventoryTable, tasksTable } from "@workspace/db";
import { eq, and, lte, gte, sql, inArray } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const [business] = await db.select({ id: businessesTable.id, name: businessesTable.name })
      .from(businessesTable).where(eq(businessesTable.userId, req.userId!));
    if (!business) { res.json({ notifications: [] }); return; }

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

    const notifications: any[] = [];
    let idSeed = 0;
    const mkId = () => `notif-${Date.now()}-${++idSeed}`;

    // Today's new bookings
    const todayBookings = await db.select({ id: bookingsTable.id, title: bookingsTable.title, scheduledAt: bookingsTable.scheduledAt })
      .from(bookingsTable).where(and(eq(bookingsTable.businessId, business.id), gte(bookingsTable.createdAt, todayStart), lte(bookingsTable.createdAt, todayEnd)));
    todayBookings.slice(0,3).forEach(b => {
      const t = b.scheduledAt ? new Date(b.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
      notifications.push({ id: mkId(), type: "booking", title: "New Booking", message: `${b.title || "Booking"} scheduled${t ? " at " + t : ""}`, createdAt: b.scheduledAt || now.toISOString() });
    });

    // Overdue invoices
    const overdueInvoices = await db.select({ id: invoicesTable.id, invoiceNumber: invoicesTable.invoiceNumber, total: invoicesTable.total, dueDate: invoicesTable.dueDate })
      .from(invoicesTable).where(and(eq(invoicesTable.businessId, business.id), inArray(invoicesTable.status, ["overdue","pending"]), lte(invoicesTable.dueDate, now)));
    overdueInvoices.slice(0,3).forEach(inv => {
      notifications.push({ id: mkId(), type: "invoice", title: "Invoice Overdue", message: `Invoice #${inv.invoiceNumber} of ₹${Number(inv.total||0).toLocaleString("en-IN")} is past due`, createdAt: inv.dueDate?.toISOString() || now.toISOString() });
    });

    // Low stock items
    const invItems = await db.select({ id: inventoryTable.id, name: inventoryTable.name, quantity: inventoryTable.quantity, lowStockThreshold: inventoryTable.lowStockThreshold, updatedAt: inventoryTable.updatedAt })
      .from(inventoryTable).where(eq(inventoryTable.businessId, business.id));
    invItems.filter(i => i.quantity <= (i.lowStockThreshold || 5)).slice(0,3).forEach(item => {
      notifications.push({ id: mkId(), type: "stock", title: "Low Stock Alert", message: `${item.name} has only ${item.quantity} units left`, createdAt: item.updatedAt?.toISOString() || now.toISOString() });
    });

    // Tasks due today
    const dueTasks = await db.select({ id: tasksTable.id, title: tasksTable.title, dueDate: tasksTable.dueDate })
      .from(tasksTable).where(and(eq(tasksTable.businessId, business.id), gte(tasksTable.dueDate, todayStart), lte(tasksTable.dueDate, todayEnd)));
    dueTasks.slice(0,2).forEach(t => {
      notifications.push({ id: mkId(), type: "task", title: "Task Due Today", message: `"${t.title}" is due today`, createdAt: t.dueDate?.toISOString() || now.toISOString() });
    });

    // Sort newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ notifications: notifications.slice(0, 10) });
  } catch (err: any) {
    req.log.error({ err }, "Notifications error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
