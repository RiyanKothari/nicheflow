import { Router } from "express";
import {
  db, businessesTable, workspaceConfigsTable, clientsTable,
  bookingsTable, invoicesTable, inventoryTable, tasksTable,
} from "@workspace/db";
import { eq, and, lte, gte, not, inArray, sql, desc } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// ── Business-type knowledge dictionary ────────────────────────────────────────

const NICHE_KNOWLEDGE: Record<string, {
  advice: string[];
  commonIssues: string[];
  seasonality: string;
  upsells: string[];
}> = {
  dog_trainer: {
    advice: ["Offer puppy starter packages to build long-term relationships", "Follow up 2 weeks after training completion", "Create group class waitlists during peak adoption seasons", "Ask clients for before/after videos — great for referrals"],
    commonIssues: ["Cancellations due to dog sickness", "Clients expecting instant results", "Session no-shows"],
    seasonality: "Peak demand in January (new year resolutions + holiday puppies) and October (pre-winter prep).",
    upsells: ["Board & train packages", "Maintenance monthly sessions", "Group socialization classes", "Training materials/tools"],
  },
  beauty_salon: {
    advice: ["Send reminders 24h before appointments to reduce no-shows", "Offer loyalty cards — 10th service free", "Upsell seasonal treatments in festive seasons", "Build WhatsApp groups for regular clients with offers"],
    commonIssues: ["Last-minute cancellations", "Managing walk-ins vs appointments", "Product inventory running out"],
    seasonality: "Peak during Diwali, Navratri, wedding season (Oct-Feb). Offer pre-bridal packages.",
    upsells: ["Hair spa add-ons", "Premium product retail", "Bridal packages", "Group party bookings"],
  },
  tailor: {
    advice: ["Always confirm measurements before cutting", "Give realistic delivery timelines and add 2 days buffer", "Photo catalog of completed work builds trust", "Festival season: take deposits to avoid last-minute rushes"],
    commonIssues: ["Delivery delays", "Measurement errors", "Rush orders near festivals"],
    seasonality: "Wedding season (Oct-Feb) and festivals (Diwali, Eid, Navratri) are peak periods.",
    upsells: ["Express alteration service", "Bulk order discounts", "Annual wardrobe packages", "Home visit measurements"],
  },
  photographer: {
    advice: ["Always collect a 30-50% deposit upfront for bookings", "Deliver sample preview within 48h to build excitement", "Upsell albums and prints at delivery time", "Build a Google review strategy — ask right after delivery"],
    commonIssues: ["Weather cancellations", "Late payment for delivered work", "Equipment issues"],
    seasonality: "Wedding season (Oct-Feb), graduation season (Apr-Jun). Book 3-6 months in advance.",
    upsells: ["Premium album packages", "Same-day edit highlights", "Annual family portraits", "Drone photography add-on"],
  },
  chef: {
    advice: ["Always confirm dietary restrictions and allergies before events", "Charge a separate deposit for grocery procurement", "Build a signature menu that differentiates you", "Post cooking process reels on Instagram for organic reach"],
    commonIssues: ["Ingredient cost fluctuations", "Last-minute guest count changes", "Equipment not available at venue"],
    seasonality: "Wedding season and festive seasons are peak. Offer Diwali/Christmas special menus.",
    upsells: ["Cooking class sessions", "Meal prep subscriptions", "Corporate lunch catering", "Specialty menu items"],
  },
  fitness_trainer: {
    advice: ["Track client progress with before/after measurements monthly", "Offer 3-month packages for better commitment and cash flow", "Morning vs evening slots have different client segments", "WhatsApp accountability groups improve retention"],
    commonIssues: ["Client motivation dips after 6 weeks", "Session no-shows", "Competition from online apps"],
    seasonality: "January (new year resolutions) and pre-summer (Mar-May) are peak inquiry periods.",
    upsells: ["Nutrition consultation add-on", "Online training for outstation clients", "Group bootcamp sessions", "Supplement sales"],
  },
  tutor: {
    advice: ["Always share progress reports with parents monthly", "Offer exam crash courses 4-6 weeks before boards", "Group tuition (3-4 students) increases income per hour", "Online classes expand your reach beyond your locality"],
    commonIssues: ["Exam season rushed cancellations", "Parents comparing rates", "Student attention during online sessions"],
    seasonality: "Board exam prep peaks Sep-Jan. Summer batches Apr-Jun for competitive exams.",
    upsells: ["Study materials and notes", "Mock test series", "Holiday revision camps", "Doubt-clearing sessions"],
  },
  home_repair: {
    advice: ["Always share a written estimate before starting work", "Take before/after photos as proof of quality", "AMC (Annual Maintenance Contracts) provide stable income", "WhatsApp quick quotes build trust and speed up conversions"],
    commonIssues: ["Material cost estimation errors", "Job scope creep", "Late payments after job completion"],
    seasonality: "Pre-monsoon season (Apr-May) is peak for repairs. Post-monsoon (Oct-Nov) for renovations.",
    upsells: ["AMC packages", "Emergency call-out premium service", "Material procurement service", "Referral network"],
  },
  urban_farmer: {
    advice: ["Build a subscription box model for predictable revenue", "Partner with local restaurants for bulk orders", "Document growing process on social media — builds trust", "Offer farm visits/workshops as premium experiences"],
    commonIssues: ["Weather/seasonal crop failures", "Pest management", "Irregular demand"],
    seasonality: "Leafy greens peak in winter (Oct-Feb). Summer crops Apr-Jun. Monsoon July-Sep is challenging.",
    upsells: ["Value-added products (jams, pickles)", "Farm-to-table delivery subscriptions", "Growing workshops", "Custom corporate gifting"],
  },
  wedding_planner: {
    advice: ["Always have a vendor backup list for every critical service", "Use a detailed checklist shared with clients on WhatsApp", "Collect staged payments tied to milestones", "Post real wedding content — clients hire from portfolios"],
    commonIssues: ["Vendor no-shows", "Budget overruns", "Last-minute guest count changes", "Family decision conflicts"],
    seasonality: "Wedding season peaks Oct-Feb. Book 6-12 months ahead. Off-season: pitch anniversary events.",
    upsells: ["Destination wedding coordination", "Engagement ceremony packages", "Corporate event services", "Décor rental business"],
  },
};

function getNicheKnowledge(niche: string) {
  if (!niche) return null;
  const key = niche.toLowerCase().replace(/\s+/g, "_");
  if (NICHE_KNOWLEDGE[key]) return NICHE_KNOWLEDGE[key];
  for (const k of Object.keys(NICHE_KNOWLEDGE)) {
    if (key.includes(k) || k.includes(key)) return NICHE_KNOWLEDGE[k];
  }
  return null;
}

// ── AI helper ─────────────────────────────────────────────────────────────────

async function callAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.REPLIT_AI_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy";
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-5-mini", messages }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

// ── helper: get business by userId ───────────────────────────────────────────

async function getBusiness(userId: number) {
  const [b] = await db.select().from(businessesTable).where(eq(businessesTable.userId, userId));
  return b ?? null;
}

async function getWorkspace(userId: number) {
  const [ws] = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId));
  return ws ?? null;
}

// ── Intent detection: parse action commands from user message ─────────────────

type ActionIntent =
  | { type: "create_task"; title: string; priority?: string; dueDate?: string }
  | { type: "none" };

function detectIntent(message: string): ActionIntent {
  const m = message.trim().toLowerCase();

  // Task creation patterns:
  // "add a task to clean floor"
  // "create a task: buy groceries"
  // "new task - call client tomorrow"
  // "add task clean floor"
  // "remind me to prepare report"
  // "make a task for review invoice"
  const taskCreate = [
    /(?:add|create|new|make)\s+(?:a\s+)?task\s+(?:to\s+|for\s+|:\s*|-\s*)?(.+)/i,
    /(?:add|create|new)\s+(?:a\s+)?reminder\s+(?:to\s+|for\s+)?(.+)/i,
    /remind\s+me\s+to\s+(.+)/i,
    /i\s+need\s+to\s+(?:remember\s+to\s+|do\s+)?(.+)\s+(?:today|tomorrow|this week)?/i,
  ];

  for (const pattern of taskCreate) {
    const match = message.match(pattern);
    if (match?.[1]) {
      let title = match[1].trim();
      // Remove trailing filler
      title = title.replace(/\s*(?:please|asap|today|tomorrow|this week|for me)\.?$/i, "").trim();
      // Capitalize first letter
      title = title.charAt(0).toUpperCase() + title.slice(1);
      if (title.length > 3 && title.length < 200) {
        // Detect priority hints
        let priority = "normal";
        if (/urgent|asap|immediately|critical|important|high/i.test(message)) priority = "high";
        else if (/low|minor|eventually|someday/i.test(message)) priority = "low";
        return { type: "create_task", title, priority };
      }
    }
  }

  return { type: "none" };
}

// ── generate-workspace ────────────────────────────────────────────────────────

router.post("/generate-workspace", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { description, businessCategory } = req.body;
    if (!description) { res.status(400).json({ error: "description is required" }); return; }

    let result: any = null;
    try {
      const aiResponse = await callAI([
        { role: "system", content: "You generate structured business profiles for Indian small businesses. Always return valid JSON only." },
        { role: "user", content: `A person in India described their small business: "${description}"\n\nGenerate a structured profile:\n{\n  "businessProfile": { "name": "catchy name", "description": "one line", "category": "dog_trainer|urban_farmer|tailor|home_repair|photographer|chef|tutor|beauty_salon|fitness_trainer|wedding_planner|other", "currency": "INR" },\n  "suggestedTasks": [{"title": "task", "priority": "high|medium|low"}],\n  "suggestedServices": ["service1", "service2", "service3"],\n  "welcomeMessage": "warm welcome 2-3 sentences"\n}\nOnly valid JSON, no other text.` }
      ], 800);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    } catch (aiErr) { req.log.error({ aiErr }, "AI generate-workspace failed"); }

    if (!result) {
      result = {
        businessProfile: { name: "My Business", description: description.slice(0, 100), category: businessCategory || "other", currency: "INR" },
        suggestedTasks: [{ title: "Set up client list", priority: "high" }, { title: "Create first invoice", priority: "medium" }],
        suggestedServices: ["Consultation", "Service Package", "Monthly Retainer"],
        welcomeMessage: "Welcome to NicheFlow! Your workspace is ready.",
      };
    }
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Generate workspace error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── suggest ───────────────────────────────────────────────────────────────────

router.post("/suggest", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { type, context } = req.body;
    if (!type || !context) { res.status(400).json({ error: "type and context are required" }); return; }
    const prompts: Record<string, string> = {
      invoice_note: `Write a professional invoice note for: ${context}. Brief and friendly.`,
      task_description: `Write a clear, actionable task description for: ${context}.`,
      client_followup: `Write a friendly follow-up message for a client: ${context}. Warm and professional.`,
      marketing_copy: `Write engaging marketing copy for a small Indian business: ${context}. Short and compelling.`,
      overdue_reminder: `Write a polite, firm WhatsApp reminder for unpaid invoice: ${context}. Culturally warm for India.`,
      booking_reminder: `Write a friendly appointment reminder: ${context}.`,
    };
    let suggestion = "Unable to generate suggestion at this time.";
    try { suggestion = await callAI([
      { role: "system", content: "You help Indian small business owners write professional messages. Be concise and practical." },
      { role: "user", content: prompts[type] || `Help with: ${context}` }
    ], 300); } catch {}
    res.json({ suggestion });
  } catch (err) {
    req.log.error({ err }, "AI suggest error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── insight ───────────────────────────────────────────────────────────────────

router.post("/insight", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }
    let insight = "";
    try { insight = await callAI([
      { role: "system", content: "You are an AI assistant for small businesses in India. Be concise and actionable." },
      { role: "user", content: prompt }
    ], 400); } catch {}
    res.json({ insight });
  } catch (err) {
    req.log.error({ err }, "AI insight error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── next-action — dashboard widget ───────────────────────────────────────────

router.get("/next-action", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const business = await getBusiness(req.userId!);
    const ws = await getWorkspace(req.userId!);
    if (!business) { res.json({ action: null }); return; }

    const terminology = (ws as any)?.terminology || {};
    const now = new Date();
    const in24h = new Date(now.getTime() + 86400000);

    const [overdueInvoices, upcomingBookings, allInventory, pendingTasks] = await Promise.all([
      db.select({ id: invoicesTable.id, amount: invoicesTable.total })
        .from(invoicesTable)
        .where(and(eq(invoicesTable.businessId, business.id), inArray(invoicesTable.status, ["overdue"])))
        .limit(5),
      db.select({ id: bookingsTable.id, scheduledAt: bookingsTable.scheduledAt })
        .from(bookingsTable)
        .where(and(eq(bookingsTable.businessId, business.id), gte(bookingsTable.scheduledAt, now), lte(bookingsTable.scheduledAt, in24h)))
        .limit(5),
      db.select({ name: inventoryTable.name, quantity: inventoryTable.quantity, threshold: inventoryTable.lowStockThreshold })
        .from(inventoryTable)
        .where(eq(inventoryTable.businessId, business.id))
        .limit(20),
      db.select({ id: tasksTable.id, title: tasksTable.title, dueDate: tasksTable.dueDate })
        .from(tasksTable)
        .where(and(eq(tasksTable.businessId, business.id), eq(tasksTable.status, "todo")))
        .limit(10),
    ]);

    const lowStockItems = allInventory.filter(i => Number(i.quantity) <= Number(i.threshold || 5));
    const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);

    let action: { type: string; message: string; href: string; priority: "high" | "medium" | "low" } | null = null;

    if (overdueInvoices.length > 0) {
      const total = overdueInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      action = { type: "invoice", message: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""} totalling ₹${total.toLocaleString("en-IN")} — send reminders now`, href: "/invoices", priority: "high" };
    } else if (upcomingBookings.length > 0) {
      action = { type: "booking", message: `${upcomingBookings.length} ${terminology.bookings || "booking"}${upcomingBookings.length > 1 ? "s" : ""} in the next 24 hours — confirm with clients?`, href: "/bookings", priority: "medium" };
    } else if (lowStockItems.length > 0) {
      action = { type: "inventory", message: `${lowStockItems.length} item${lowStockItems.length > 1 ? "s" : ""} running low: ${lowStockItems.slice(0, 2).map(i => i.name).join(", ")}`, href: "/inventory", priority: "medium" };
    } else if (overdueTasks.length > 0) {
      action = { type: "task", message: `${overdueTasks.length} overdue ${terminology.tasks || "task"}${overdueTasks.length > 1 ? "s" : ""} need attention`, href: "/tasks", priority: "medium" };
    } else if (pendingTasks.length > 0) {
      action = { type: "task", message: `${pendingTasks.length} pending ${terminology.tasks || "task"}${pendingTasks.length > 1 ? "s" : ""}. Stay on top of your day!`, href: "/tasks", priority: "low" };
    }

    res.json({ action });
  } catch (err) {
    req.log.error({ err }, "Next action error");
    res.json({ action: null });
  }
});

// ── weekly-digest ─────────────────────────────────────────────────────────────

router.get("/weekly-digest", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const business = await getBusiness(req.userId!);
    const ws = await getWorkspace(req.userId!);
    if (!business) { res.json({ digest: null }); return; }

    const terminology = (ws as any)?.terminology || {};
    const niche: string = (ws as any)?.niche || "business";
    const nicheKnowledge = getNicheKnowledge(niche);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const nextWeek = new Date(now.getTime() + 7 * 86400000);

    const [recentBookings, recentInvoices, newClients, upcomingBookings] = await Promise.all([
      db.select({ status: bookingsTable.status })
        .from(bookingsTable)
        .where(and(eq(bookingsTable.businessId, business.id), gte(bookingsTable.scheduledAt, weekAgo), lte(bookingsTable.scheduledAt, now))),
      db.select({ status: invoicesTable.status, amount: invoicesTable.total })
        .from(invoicesTable)
        .where(and(eq(invoicesTable.businessId, business.id), gte(invoicesTable.createdAt, weekAgo))),
      db.select({ id: clientsTable.id })
        .from(clientsTable)
        .where(and(eq(clientsTable.businessId, business.id), gte(clientsTable.createdAt, weekAgo))),
      db.select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(and(eq(bookingsTable.businessId, business.id), gte(bookingsTable.scheduledAt, now), lte(bookingsTable.scheduledAt, nextWeek))),
    ]);

    const totalRevenue = recentInvoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0);
    const completedBookings = recentBookings.filter(b => b.status === "completed").length;

    const contextBlock = `Last 7 days for ${business.name} (${niche}):
- ${completedBookings} completed ${terminology.bookings || "bookings"}
- ₹${totalRevenue.toLocaleString("en-IN")} revenue collected
- ${newClients.length} new ${terminology.clients || "clients"} added
- ${upcomingBookings.length} ${terminology.bookings || "bookings"} scheduled this week
${nicheKnowledge ? `\nBusiness tip: ${nicheKnowledge.advice[Math.floor(Math.random() * nicheKnowledge.advice.length)]}` : ""}`;

    let digest = `Last week: ${completedBookings} completed sessions, ₹${totalRevenue.toLocaleString("en-IN")} collected, ${newClients.length} new clients. ${upcomingBookings.length} sessions scheduled ahead — keep it up!`;
    try {
      digest = await callAI([
        { role: "system", content: `You write weekly business digests for ${niche} business owners in India. Be encouraging, data-driven. Use 2-3 short sentences.` },
        { role: "user", content: `Write a weekly digest:\n${contextBlock}` }
      ], 200);
    } catch {}

    res.json({ digest, stats: { completedBookings, totalRevenue, newClients: newClients.length, upcomingBookings: upcomingBookings.length } });
  } catch (err) {
    req.log.error({ err }, "Weekly digest error");
    res.json({ digest: null });
  }
});

// ── invoice-reminder ──────────────────────────────────────────────────────────

router.post("/invoice-reminder", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) { res.status(400).json({ error: "invoiceId required" }); return; }

    const business = await getBusiness(req.userId!);
    const [invoice] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, invoiceId));
    if (!invoice || !business) { res.status(404).json({ error: "Not found" }); return; }

    const [client] = invoice.clientId
      ? await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, invoice.clientId))
      : [null];

    const daysOverdue = invoice.dueDate
      ? Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000))
      : 0;

    let message = `Hi ${client?.name || "there"}! This is ${business.name}. Your invoice of ₹${Number(invoice.total || 0).toLocaleString("en-IN")} is overdue. Could you please make the payment at your earliest convenience? Thank you! 🙏`;
    try {
      message = await callAI([
        { role: "system", content: "You write payment reminder messages for Indian small business owners. Be warm and professional." },
        { role: "user", content: `Write a polite WhatsApp payment reminder.\nBusiness: ${business.name}\nClient: ${client?.name || "the client"}\nAmount: ₹${Number(invoice.total || 0).toLocaleString("en-IN")}\nDays overdue: ${daysOverdue}\nMake it friendly, under 80 words, Hinglish or English, ready to copy-paste.` }
      ], 200);
    } catch {}

    res.json({ message });
  } catch (err) {
    req.log.error({ err }, "Invoice reminder error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── task-suggestions ─────────────────────────────────────────────────────────

router.post("/task-suggestions", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { serviceName, clientName } = req.body;
    const ws = await getWorkspace(req.userId!);
    const niche = (ws as any)?.niche || "business";

    let suggestions: string[] = [];
    try {
      const aiResponse = await callAI([
        { role: "system", content: `You suggest preparation tasks for ${niche} business bookings. Return a JSON array of 3-4 short task strings only.` },
        { role: "user", content: `Booking for "${serviceName || "a service"}" with "${clientName || "a client"}". Suggest 3-4 prep tasks. JSON array only like ["task1","task2"].` }
      ], 200);
      const match = aiResponse.match(/\[[\s\S]*?\]/);
      if (match) suggestions = JSON.parse(match[0]);
    } catch {}

    if (!suggestions.length) {
      suggestions = [`Prepare for ${serviceName || "session"}`, `Confirm with ${clientName || "client"}`, "Set up workspace/equipment"];
    }

    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "Task suggestions error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── chat — conversational assistant with full business context + action execution ──

router.post("/chat", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { message, history = [], language = "en" } = req.body;
    if (!message?.trim()) { res.status(400).json({ error: "message is required" }); return; }

    const business = await getBusiness(req.userId!);
    const ws = await getWorkspace(req.userId!);

    const terminology = (ws as any)?.terminology || {};
    const services: string[] = (ws as any)?.services || [];
    const niche: string = (ws as any)?.niche || "small business";
    const clientTerm = terminology.clients || "clients";
    const bookingTerm = terminology.bookings || "bookings";
    const invTerm = terminology.inventory || "inventory";
    const taskTerm = terminology.tasks || "tasks";
    const nicheKnowledge = getNicheKnowledge(niche);

    // ── Step 1: Detect action intents and execute them ────────────────────────
    const intent = detectIntent(message);
    let executedAction: { type: string; data: any } | null = null;

    if (intent.type === "create_task" && business) {
      try {
        const [newTask] = await db.insert(tasksTable).values({
          businessId: business.id,
          title: intent.title,
          status: "todo",
          priority: intent.priority || "normal",
          subtasks: [],
          comments: [],
        } as any).returning({ id: tasksTable.id, title: tasksTable.title });
        executedAction = { type: "create_task", data: { id: newTask.id, title: newTask.title } };
      } catch (e) {
        req.log.error({ e }, "Task creation via chat failed");
      }
    }

    // ── Step 2: Build rich business context ───────────────────────────────────
    let richContext = "";
    if (business) {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);

      const [
        todayBookings, upcomingBookings, recentClients, unpaidInvoices,
        overdueInvoices, allInventory, pendingTasks, completedThisWeek,
      ] = await Promise.all([
        db.select({ id: bookingsTable.id, scheduledAt: bookingsTable.scheduledAt, status: bookingsTable.status, clientId: bookingsTable.clientId })
          .from(bookingsTable)
          .where(and(
            eq(bookingsTable.businessId, business.id),
            gte(bookingsTable.scheduledAt, new Date(new Date().setHours(0,0,0,0))),
            lte(bookingsTable.scheduledAt, new Date(new Date().setHours(23,59,59,999))),
          )).limit(10),
        db.select({ scheduledAt: bookingsTable.scheduledAt, status: bookingsTable.status })
          .from(bookingsTable)
          .where(and(eq(bookingsTable.businessId, business.id), gte(bookingsTable.scheduledAt, now)))
          .limit(5),
        db.select({ name: clientsTable.name, createdAt: clientsTable.createdAt })
          .from(clientsTable)
          .where(eq(clientsTable.businessId, business.id))
          .orderBy(desc(clientsTable.createdAt))
          .limit(5),
        db.select({ id: invoicesTable.id, total: invoicesTable.total, clientId: invoicesTable.clientId })
          .from(invoicesTable)
          .where(and(eq(invoicesTable.businessId, business.id), inArray(invoicesTable.status, ["pending", "sent"])))
          .limit(10),
        db.select({ id: invoicesTable.id, total: invoicesTable.total, dueDate: invoicesTable.dueDate, clientId: invoicesTable.clientId })
          .from(invoicesTable)
          .where(and(eq(invoicesTable.businessId, business.id), inArray(invoicesTable.status, ["overdue"])))
          .limit(10),
        db.select({ name: inventoryTable.name, quantity: inventoryTable.quantity, threshold: inventoryTable.lowStockThreshold, unit: inventoryTable.unit })
          .from(inventoryTable)
          .where(eq(inventoryTable.businessId, business.id))
          .limit(20),
        db.select({ title: tasksTable.title, status: tasksTable.status, dueDate: tasksTable.dueDate, priority: tasksTable.priority })
          .from(tasksTable)
          .where(and(eq(tasksTable.businessId, business.id), not(inArray(tasksTable.status, ["done"]))))
          .limit(10),
        db.select({ id: bookingsTable.id })
          .from(bookingsTable)
          .where(and(eq(bookingsTable.businessId, business.id), gte(bookingsTable.scheduledAt, weekAgo), eq(bookingsTable.status, "completed"))),
      ]);

      const lowStock = allInventory.filter(i => Number(i.quantity) <= Number(i.threshold || 5));
      const unpaidTotal = unpaidInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
      const overdueTotal = overdueInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
      const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);

      richContext = `
Live data for ${business.name}:
- Recent ${clientTerm}: ${recentClients.map(c => c.name).join(", ") || "none added yet"}
- ${bookingTerm} today: ${todayBookings.length} | Upcoming: ${upcomingBookings.length}
- Pending invoices: ${unpaidInvoices.length} (₹${unpaidTotal.toLocaleString("en-IN")}) | OVERDUE: ${overdueInvoices.length} (₹${overdueTotal.toLocaleString("en-IN")})
- Low stock: ${lowStock.length > 0 ? lowStock.map(i => `${i.name} (${i.quantity} ${i.unit || "units"})`).join(", ") : "none"}
- Pending ${taskTerm}: ${pendingTasks.length} | Overdue: ${overdueTasks.length}
- Completed this week: ${completedThisWeek.length} ${bookingTerm}
- Services: ${services.slice(0, 6).join(", ") || "various"}`;
    }

    const nicheAdvice = nicheKnowledge
      ? `\nNiche tips for ${niche}: Seasonal — ${nicheKnowledge.seasonality} Upsells: ${nicheKnowledge.upsells.slice(0,3).join(", ")}`
      : "";

    const langNote = language === "hi"
      ? "Reply in Hindi (Devanagari script)."
      : "Reply in English.";

    // ── Step 3: Build system prompt (includes action confirmation if executed) ─
    const executionNote = executedAction?.type === "create_task"
      ? `\n\nACTION ALREADY EXECUTED: You just created a task titled "${executedAction.data.title}" (ID: ${executedAction.data.id}) in their task list. Confirm this to the user warmly and tell them it's in their Tasks page.`
      : "";

    const systemPrompt = `You are the AI assistant for ${business?.name || "this business"}, a ${niche} business in India.

Use their terminology: "${clientTerm}" (not "clients"), "${bookingTerm}" (not "bookings"), "${taskTerm}" (not "tasks").
${richContext}
${nicheAdvice}
${executionNote}

Navigation: Dashboard, /${bookingTerm.toLowerCase()}, /${clientTerm.toLowerCase()}, /invoices, /inventory, /tasks, /settings

You can:
1. Answer questions about their data (use exact numbers/names from the context)
2. Give ${niche}-specific business advice
3. Draft WhatsApp/email messages
4. Help navigate the app
5. Execute actions (task creation happens automatically — just confirm it)

Be concise (2-4 sentences), warm, practical. ${langNote}`;

    // ── Step 4: Call AI ───────────────────────────────────────────────────────
    let reply = "";
    try {
      reply = await callAI([
        { role: "system", content: systemPrompt },
        ...history.slice(-8).map((h: any) => ({ role: h.role, content: h.content })),
        { role: "user", content: message },
      ], 400);
    } catch (e: any) {
      req.log.error({ e }, "AI chat call failed");
    }

    if (!reply) {
      if (executedAction?.type === "create_task") {
        reply = `✅ Done! I've added "${executedAction.data.title}" to your ${taskTerm} list. You can view it on the Tasks page.`;
      } else {
        reply = "I'm not sure how to help with that right now. Try navigating to the relevant section.";
      }
    }

    res.json({ reply, action: executedAction });
  } catch (err: any) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ reply: "Sorry, I encountered an error. Please try again." });
  }
});

export default router;
