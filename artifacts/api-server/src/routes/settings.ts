import { Router } from "express";
import { db, usersTable, businessesTable, workspaceConfigsTable } from "@workspace/db";
import { clientsTable, bookingsTable, invoicesTable, inventoryTable, tasksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAll(userId: number) {
  const [user]     = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, userId));
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.userId, userId));
  const [ws]       = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId));
  return { user, business, workspace: ws };
}

function defaultSettings() {
  return {
    notifications: {
      newBooking:     { inApp: true,  whatsapp: false, email: true  },
      invoiceOverdue: { inApp: true,  whatsapp: false, email: true  },
      lowStock:       { inApp: true,  whatsapp: false, email: false },
      taskDue:        { inApp: true,  whatsapp: false, email: false },
      newReview:      { inApp: true,  whatsapp: false, email: true  },
      quietHours:     { enabled: false, from: "22:00", to: "07:00" },
      weeklyDigest:   true,
    },
    aiPrefs: { enabled: true, frequency: "balanced", tone: "friendly" },
    teamMembers: [] as any[],
    integrations: {
      whatsapp:       { connected: false },
      googleCalendar: { connected: false },
      razorpay:       { keyId: "", keySecret: "" },
      instagram:      { connected: false },
    },
    dashboardWidgets: {
      revenueChart:     true,
      upcomingBookings: true,
      quickActions:     true,
      aiInsights:       true,
      recentClients:    true,
      stockAlerts:      true,
    },
    operatingHours: {
      monday:    { open: true,  from: "09:00", to: "18:00" },
      tuesday:   { open: true,  from: "09:00", to: "18:00" },
      wednesday: { open: true,  from: "09:00", to: "18:00" },
      thursday:  { open: true,  from: "09:00", to: "18:00" },
      friday:    { open: true,  from: "09:00", to: "18:00" },
      saturday:  { open: false, from: "10:00", to: "14:00" },
      sunday:    { open: false, from: "10:00", to: "14:00" },
    },
    simpleMode: false,
    showInDirectory: true,
    billing: { plan: "free" },
  };
}

function mergeSettings(existing: any): any {
  const def = defaultSettings();
  if (!existing) return def;
  return {
    notifications:    { ...def.notifications,    ...(existing.notifications    || {}) },
    aiPrefs:          { ...def.aiPrefs,           ...(existing.aiPrefs          || {}) },
    teamMembers:      existing.teamMembers       || def.teamMembers,
    integrations:     { ...def.integrations,     ...(existing.integrations     || {}) },
    dashboardWidgets: { ...def.dashboardWidgets, ...(existing.dashboardWidgets || {}) },
    operatingHours:   { ...def.operatingHours,   ...(existing.operatingHours   || {}) },
    simpleMode:       existing.simpleMode       ?? def.simpleMode,
    showInDirectory:  existing.showInDirectory  ?? def.showInDirectory,
    billing:          existing.billing          || def.billing,
  };
}

async function getSettings(userId: number) {
  const [ws] = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId));
  return mergeSettings(ws?.settings as any);
}

async function patchSettings(userId: number, patch: object) {
  const current = await getSettings(userId);
  const merged  = { ...current, ...patch };
  await db.update(workspaceConfigsTable).set({ settings: merged, updatedAt: new Date() }).where(eq(workspaceConfigsTable.userId, userId));
  return merged;
}

// ── GET /api/settings ─────────────────────────────────────────────────────────

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { user, business, workspace } = await getAll(req.userId!);
    const settings = mergeSettings(workspace?.settings as any);
    res.json({ user, business, workspace, settings });
  } catch (err: any) {
    req.log.error({ err }, "Get settings error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/settings/profile ─────────────────────────────────────────────────

router.put("/profile", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, businessName, email, phone, address, city, currency, description, operatingHours } = req.body;
    if (name) {
      await db.update(usersTable).set({ name, updatedAt: new Date() }).where(eq(usersTable.id, req.userId!));
    }
    await db.update(businessesTable).set({
      ...(businessName  && { name: businessName }),
      ...(email         !== undefined && { email }),
      ...(phone         !== undefined && { phone }),
      ...(address       !== undefined && { address }),
      ...(city          !== undefined && { city }),
      ...(currency      && { currency }),
      ...(description   !== undefined && { description }),
      updatedAt: new Date(),
    }).where(eq(businessesTable.userId, req.userId!));
    if (operatingHours) await patchSettings(req.userId!, { operatingHours });
    const { user, business } = await getAll(req.userId!);
    res.json({ user, business });
  } catch (err: any) {
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/settings/workspace ───────────────────────────────────────────────

router.put("/workspace", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { terminology, modules, simpleMode, dashboardWidgets } = req.body;
    const patch: any = {};
    if (typeof simpleMode === "boolean")     patch.simpleMode = simpleMode;
    if (dashboardWidgets)                    patch.dashboardWidgets = dashboardWidgets;
    if (Object.keys(patch).length > 0)      await patchSettings(req.userId!, patch);
    await db.update(workspaceConfigsTable).set({
      ...(terminology && { terminology }),
      ...(modules     && { modules }),
      updatedAt: new Date(),
    }).where(eq(workspaceConfigsTable.userId, req.userId!));
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Update workspace error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/settings/language ────────────────────────────────────────────────

router.put("/language", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { language } = req.body;
    await db.update(workspaceConfigsTable).set({ language: language || "en", updatedAt: new Date() }).where(eq(workspaceConfigsTable.userId, req.userId!));
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Update language error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/settings/notifications ──────────────────────────────────────────

router.put("/notifications", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { notifications } = req.body;
    await patchSettings(req.userId!, { notifications });
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Update notifications error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/settings/ai ──────────────────────────────────────────────────────

router.put("/ai", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { aiPrefs } = req.body;
    await patchSettings(req.userId!, { aiPrefs });
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Update AI prefs error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/settings/integrations ───────────────────────────────────────────

router.put("/integrations", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { integrations } = req.body;
    await patchSettings(req.userId!, { integrations });
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Update integrations error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── POST /api/settings/team/invite ────────────────────────────────────────────

router.post("/team/invite", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { email, role, name } = req.body;
    if (!email?.trim()) { res.status(400).json({ error: "Email required" }); return; }
    const current = await getSettings(req.userId!);
    const member = { id: Date.now().toString(), email: email.trim(), name: name || email.split("@")[0], role: role || "staff", status: "invited", createdAt: new Date().toISOString() };
    await patchSettings(req.userId!, { teamMembers: [...(current.teamMembers || []), member] });
    res.json({ member });
  } catch (err: any) {
    req.log.error({ err }, "Team invite error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── DELETE /api/settings/team/:memberId ──────────────────────────────────────

router.delete("/team/:memberId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const current = await getSettings(req.userId!);
    const updated = (current.teamMembers || []).filter((m: any) => m.id !== req.params.memberId);
    await patchSettings(req.userId!, { teamMembers: updated });
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Delete team member error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── DELETE /api/settings/account ──────────────────────────────────────────────

router.delete("/account", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== "DELETE") { res.status(400).json({ error: "Type DELETE to confirm" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, req.userId!));
    res.json({ ok: true, message: "Account deleted" });
  } catch (err: any) {
    req.log.error({ err }, "Delete account error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── GET /api/settings/export/:type ───────────────────────────────────────────

router.get("/export/:type", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { type } = req.params;
    const { business } = await getAll(req.userId!);
    if (!business) { res.status(404).json({ error: "No business" }); return; }

    let rows: object[] = [];
    let headers: string[] = [];

    if (type === "clients") {
      rows = await db.select().from(clientsTable).where(eq(clientsTable.businessId, business.id));
      headers = ["id","name","email","phone","address","createdAt"];
    } else if (type === "bookings") {
      rows = await db.select().from(bookingsTable).where(eq(bookingsTable.businessId, business.id));
      headers = ["id","clientId","title","status","scheduledAt","duration","price","notes","createdAt"];
    } else if (type === "invoices") {
      rows = await db.select().from(invoicesTable).where(eq(invoicesTable.businessId, business.id));
      headers = ["id","clientId","invoiceNumber","status","total","dueDate","createdAt"];
    } else if (type === "inventory") {
      rows = await db.select().from(inventoryTable).where(eq(inventoryTable.businessId, business.id));
      headers = ["id","name","category","quantity","unit","costPrice","sellingPrice","lowStockThreshold"];
    } else if (type === "tasks") {
      rows = await db.select().from(tasksTable).where(eq(tasksTable.businessId, business.id));
      headers = ["id","title","status","priority","dueDate","createdAt"];
    } else {
      res.status(400).json({ error: "Unknown export type" }); return;
    }

    const csv = [headers.join(","), ...rows.map((r: any) => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-export.csv"`);
    res.send(csv);
  } catch (err: any) {
    req.log.error({ err }, "Export error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
