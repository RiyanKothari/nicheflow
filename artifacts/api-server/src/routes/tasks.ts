import { Router } from "express";
import { db, tasksTable, businessesTable, clientsTable } from "@workspace/db";
import { eq, and, sql, desc, gte, lte, lt, isNull, or } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

async function getBusinessId(userId: number): Promise<number | null> {
  const [b] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return b?.id ?? null;
}

function mapTask(t: any) {
  return {
    ...t,
    subtasks: (t.subtasks as any[]) || [],
    comments: (t.comments as any[]) || [],
  };
}

function nextRecurrence(dueDate: Date, recurring: string): Date | null {
  const d = new Date(dueDate);
  if (recurring === "daily")   { d.setDate(d.getDate() + 1); return d; }
  if (recurring === "weekly")  { d.setDate(d.getDate() + 7); return d; }
  if (recurring === "monthly") { d.setMonth(d.getMonth() + 1); return d; }
  return null;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json({ total: 0, dueToday: 0, overdue: 0, completedThisWeek: 0 }); return; }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86400000);
    const weekStart  = new Date(now.getTime() - 7 * 86400000);

    const [total]   = await db.select({ v: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.businessId, businessId), sql`status != 'done'`));
    const [dueToday] = await db.select({ v: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.businessId, businessId), sql`status != 'done'`, gte(tasksTable.dueDate, todayStart), lt(tasksTable.dueDate, todayEnd)));
    const [overdue]  = await db.select({ v: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.businessId, businessId), sql`status != 'done'`, lt(tasksTable.dueDate, todayStart)));
    const [completed] = await db.select({ v: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.businessId, businessId), sql`status = 'done'`, gte(tasksTable.completedAt, weekStart)));

    res.json({ total: total.v, dueToday: dueToday.v, overdue: overdue.v, completedThisWeek: completed.v });
  } catch (err) {
    req.log.error({ err }, "Task stats error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── List ─────────────────────────────────────────────────────────────────────

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.json([]); return; }

    const { status, priority, clientId, filter } = req.query;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86400000);

    let conditions: any[] = [eq(tasksTable.businessId, businessId)];
    if (status)   conditions.push(sql`tasks.status = ${status}`);
    if (priority) conditions.push(sql`tasks.priority = ${priority}`);
    if (clientId) conditions.push(eq(tasksTable.clientId, Number(clientId)));
    if (filter === "today")   { conditions.push(gte(tasksTable.dueDate, todayStart)); conditions.push(lt(tasksTable.dueDate, todayEnd)); }
    if (filter === "overdue") { conditions.push(lt(tasksTable.dueDate, todayStart)); conditions.push(sql`tasks.status != 'done'`); }
    if (filter === "no_date") conditions.push(isNull(tasksTable.dueDate));

    const tasks = await db.select({
      id: tasksTable.id,
      businessId: tasksTable.businessId,
      clientId: tasksTable.clientId,
      clientName: clientsTable.name,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      priority: tasksTable.priority,
      dueDate: tasksTable.dueDate,
      completedAt: tasksTable.completedAt,
      subtasks: tasksTable.subtasks,
      comments: tasksTable.comments,
      recurring: tasksTable.recurring,
      position: tasksTable.position,
      createdAt: tasksTable.createdAt,
      updatedAt: tasksTable.updatedAt,
    }).from(tasksTable)
      .leftJoin(clientsTable, eq(tasksTable.clientId, clientsTable.id))
      .where(and(...conditions))
      .orderBy(tasksTable.position, desc(tasksTable.createdAt));

    res.json(tasks.map(mapTask));
  } catch (err) {
    req.log.error({ err }, "Get tasks error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Create ─────────────────────────────────────────────────────────────────────

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(400).json({ error: "Create a business first" }); return; }

    const { title, description, status, priority, dueDate, clientId, subtasks, recurring, position } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const [task] = await db.insert(tasksTable).values({
      businessId,
      clientId: clientId ? Number(clientId) : null,
      title, description,
      status: status || "todo",
      priority: priority || "normal",
      dueDate: dueDate ? new Date(dueDate) : null,
      subtasks: subtasks || [],
      recurring: recurring || "none",
      position: position ?? 0,
    }).returning();

    // Fetch with client name
    const [full] = await db.select({
      id: tasksTable.id, businessId: tasksTable.businessId, clientId: tasksTable.clientId, clientName: clientsTable.name,
      title: tasksTable.title, description: tasksTable.description, status: tasksTable.status, priority: tasksTable.priority,
      dueDate: tasksTable.dueDate, completedAt: tasksTable.completedAt, subtasks: tasksTable.subtasks,
      comments: tasksTable.comments, recurring: tasksTable.recurring, position: tasksTable.position,
      createdAt: tasksTable.createdAt, updatedAt: tasksTable.updatedAt,
    }).from(tasksTable).leftJoin(clientsTable, eq(tasksTable.clientId, clientsTable.id)).where(eq(tasksTable.id, task.id));

    res.status(201).json(mapTask(full));
  } catch (err) {
    req.log.error({ err }, "Create task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Update ─────────────────────────────────────────────────────────────────────

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { title, description, status, priority, dueDate, clientId, subtasks, comments, recurring, position } = req.body;

    let completedAt = existing.completedAt;
    if (status === "done" && existing.status !== "done") completedAt = new Date();
    if (status && status !== "done") completedAt = null;

    const [updated] = await db.update(tasksTable).set({
      title:       title       ?? existing.title,
      description: description ?? existing.description,
      status:      status      ?? existing.status,
      priority:    priority    ?? existing.priority,
      clientId:    clientId !== undefined ? (clientId ? Number(clientId) : null) : existing.clientId,
      dueDate:     dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
      subtasks:    subtasks    ?? existing.subtasks,
      comments:    comments    ?? existing.comments,
      recurring:   recurring   ?? existing.recurring,
      position:    position    ?? existing.position,
      completedAt,
      updatedAt: new Date(),
    }).where(eq(tasksTable.id, id)).returning();

    // Auto-create next recurrence when done
    if (status === "done" && existing.status !== "done" && updated.recurring !== "none" && updated.dueDate) {
      const nextDue = nextRecurrence(updated.dueDate, updated.recurring);
      if (nextDue) {
        await db.insert(tasksTable).values({
          businessId: businessId!,
          clientId: updated.clientId,
          title: updated.title,
          description: updated.description,
          status: "todo",
          priority: updated.priority,
          dueDate: nextDue,
          subtasks: [],
          recurring: updated.recurring,
          position: 0,
        });
      }
    }

    res.json(mapTask(updated));
  } catch (err) {
    req.log.error({ err }, "Update task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Patch status ───────────────────────────────────────────────────────────────

router.patch("/:id/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: "status required" }); return; }

    const [existing] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const completedAt = status === "done" ? new Date() : null;
    const [updated] = await db.update(tasksTable).set({ status, completedAt, updatedAt: new Date() }).where(eq(tasksTable.id, id)).returning();

    // Auto-create next recurrence
    if (status === "done" && existing.status !== "done" && updated.recurring !== "none" && updated.dueDate) {
      const nextDue = nextRecurrence(updated.dueDate, updated.recurring);
      if (nextDue) {
        await db.insert(tasksTable).values({
          businessId: businessId!, clientId: updated.clientId, title: updated.title,
          description: updated.description, status: "todo", priority: updated.priority,
          dueDate: nextDue, subtasks: [], recurring: updated.recurring, position: 0,
        });
      }
    }

    res.json(mapTask(updated));
  } catch (err) {
    req.log.error({ err }, "Patch task status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Subtasks ───────────────────────────────────────────────────────────────────

router.post("/:id/subtasks", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { title } = req.body;
    if (!title) { res.status(400).json({ error: "title required" }); return; }

    const existingSubtasks = (existing.subtasks as any[]) || [];
    const newSubtask = { id: Date.now(), title, done: false };
    const [updated] = await db.update(tasksTable).set({ subtasks: [...existingSubtasks, newSubtask], updatedAt: new Date() }).where(eq(tasksTable.id, id)).returning();
    res.json(mapTask(updated));
  } catch (err) {
    req.log.error({ err }, "Add subtask error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/:id/subtasks/:subId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const subId = parseInt(req.params.subId);
    const [existing] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const subs = (existing.subtasks as any[]) || [];
    const { done, title, _delete } = req.body;
    let updated_subs = subs;
    if (_delete) {
      updated_subs = subs.filter((s: any) => s.id !== subId);
    } else {
      updated_subs = subs.map((s: any) => s.id === subId ? { ...s, done: done !== undefined ? done : s.done, title: title ?? s.title } : s);
    }

    const [updated] = await db.update(tasksTable).set({ subtasks: updated_subs, updatedAt: new Date() }).where(eq(tasksTable.id, id)).returning();
    res.json(mapTask(updated));
  } catch (err) {
    req.log.error({ err }, "Update subtask error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Comments ───────────────────────────────────────────────────────────────────

router.post("/:id/comments", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.businessId, businessId!))).limit(1);
    if (!existing) { res.status(404).json({ error: "Not Found" }); return; }

    const { text } = req.body;
    if (!text) { res.status(400).json({ error: "text required" }); return; }

    const existingComments = (existing.comments as any[]) || [];
    const newComment = { id: Date.now(), text, createdAt: new Date().toISOString() };
    const [updated] = await db.update(tasksTable).set({ comments: [...existingComments, newComment], updatedAt: new Date() }).where(eq(tasksTable.id, id)).returning();
    res.json(mapTask(updated));
  } catch (err) {
    req.log.error({ err }, "Add comment error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Delete ─────────────────────────────────────────────────────────────────────

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.businessId, businessId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete task error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
