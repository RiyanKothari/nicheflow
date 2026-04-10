import { Router } from "express";
import { db } from "@workspace/db";
import { workspaceConfigsTable, businessesTable, clientsTable, bookingsTable, tasksTable, inventoryTable } from "@workspace/db/schema";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { eq } from "drizzle-orm";

const router = Router();

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.REPLIT_AI_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_completion_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error: ${response.status} - ${text}`);
  }

  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

const WORKSPACE_SYSTEM_PROMPT = `You are NicheFlow's workspace generator. The user will describe ANY type of business. Your job is to deeply understand their business and generate a complete, accurate workspace configuration. No matter what business they describe — a barbershop, a dance academy, a food truck, a gym, a legal consultant, a wedding planner, a driving school, a flower shop, a bakery, a mechanic, a music teacher, a yoga studio, a fisherman, a carpenter, a nurse running home visits, an astrologer, a tutor, a travel agent, a dog trainer, a photographer, or anything else — generate a perfectly tailored workspace.

Respond with ONLY this exact JSON structure (no other text, no markdown, no code blocks):
{
  "niche": "string — the exact detected business type (e.g. Barbershop, Dance Academy, Home Baker, Mobile Mechanic)",
  "nicheEmoji": "string — one single relevant emoji for this business",
  "businessName": "string — catchy business name extracted or suggested based on description",
  "modules": ["bookings", "clients", "invoices", "inventory", "tasks", "publicPage"],
  "terminology": {
    "clients": "string — what this business calls customers (e.g. Students, Patients, Guests, Customers, Pet Owners)",
    "bookings": "string — what this business calls appointments (e.g. Sessions, Classes, Jobs, Orders, Appointments)",
    "inventory": "string — what this business calls their stock (e.g. Ingredients, Materials, Supplies, Equipment)",
    "tasks": "string — what this business calls their to-dos (e.g. Tasks, Jobs, Action Items, Reminders)"
  },
  "services": ["array of exactly 6 realistic service names for this specific business type with realistic INR pricing context"],
  "customClientFields": [
    {"id": "f1", "label": "string", "type": "text|number|textarea|select|date|phone|checkbox", "placeholder": "string", "required": false, "options": ["only for select type"]},
    {"id": "f2", "label": "string", "type": "text|number|textarea|select|date|phone|checkbox", "placeholder": "string", "required": false}
  ],
  "customBookingFields": [
    {"id": "b1", "label": "string", "type": "text|number|textarea|select|date|phone|checkbox", "placeholder": "string", "required": false},
    {"id": "b2", "label": "string", "type": "text|number|textarea|select|date|phone|checkbox", "placeholder": "string", "required": false}
  ],
  "kanbanColumns": ["Column 1 name", "Column 2 name", "Column 3 name", "Column 4 name"],
  "inventoryCategories": ["Category 1", "Category 2", "Category 3", "Category 4", "Category 5"],
  "inventoryUnits": ["unit1", "unit2", "unit3", "unit4"],
  "dashboardMetric": "string — the most important metric for this business (e.g. Haircuts today, Orders in queue, Classes today)",
  "greeting": "string — personalized dashboard greeting (e.g. Ready for today's appointments?)",
  "suggestedTagline": "string — compelling public page tagline for this business",
  "color": "purple|teal|coral|amber|blue",
  "sampleData": {
    "clients": [
      {"name": "realistic Indian name", "phone": "9xxxxxxxxx", "email": "name@example.com", "notes": "realistic note", "customFields": {"f1": "value", "f2": "value"}},
      {"name": "realistic Indian name", "phone": "9xxxxxxxxx", "email": "name@example.com", "notes": "realistic note", "customFields": {"f1": "value", "f2": "value"}},
      {"name": "realistic Indian name", "phone": "9xxxxxxxxx", "email": "name@example.com", "notes": "realistic note", "customFields": {"f1": "value", "f2": "value"}}
    ],
    "bookings": [
      {"title": "service — client name", "service": "service name", "notes": "realistic note", "amount": 500, "status": "confirmed"},
      {"title": "service — client name", "service": "service name", "notes": "realistic note", "amount": 800, "status": "pending"},
      {"title": "service — client name", "service": "service name", "notes": "realistic note", "amount": 1200, "status": "confirmed"}
    ],
    "inventory": [
      {"name": "item name", "category": "category", "quantity": "10", "unit": "pcs", "lowStockThreshold": "3", "sellingPrice": "200", "costPrice": "150"},
      {"name": "item name", "category": "category", "quantity": "5", "unit": "kg", "lowStockThreshold": "2", "sellingPrice": "450", "costPrice": "300"},
      {"name": "item name", "category": "category", "quantity": "8", "unit": "pcs", "lowStockThreshold": "2", "sellingPrice": "350", "costPrice": "250"},
      {"name": "item name", "category": "category", "quantity": "2", "unit": "bottles", "lowStockThreshold": "3", "sellingPrice": "180", "costPrice": "120"},
      {"name": "item name", "category": "category", "quantity": "15", "unit": "pcs", "lowStockThreshold": "5", "sellingPrice": "80", "costPrice": "50"}
    ],
    "tasks": [
      {"title": "realistic task for this business", "priority": "high"},
      {"title": "realistic task for this business", "priority": "normal"},
      {"title": "realistic task for this business", "priority": "high"},
      {"title": "realistic task for this business", "priority": "normal"}
    ]
  },
  "nextActionTemplates": [
    "string — smart suggestion template specific to this business type",
    "string — smart suggestion template specific to this business type",
    "string — smart suggestion template specific to this business type"
  ]
}

Rules:
- Be SPECIFIC to the exact business described. Never give generic answers.
- customClientFields: 3-4 fields that make sense for this specific business (e.g. barbershop: Hair Type, Preferred Barber, Usual Service; mechanic: Vehicle Make, Vehicle Model, License Plate; dance academy: Dance Style, Skill Level, Parent Contact)
- customBookingFields: 2-3 fields specific to this business's appointment needs
- kanbanColumns: 4 business-workflow-appropriate column names (the 4 internal statuses are todo, in_progress, done, on_hold — give them business-specific labels)
- inventoryCategories: 5 categories that match what this business actually stocks
- inventoryUnits: 4-5 units of measurement this business actually uses
- sampleData: Use realistic Indian names, phone numbers starting with 9/8/7/6, and amounts in INR
- Always include all 6 services
- Respond with valid JSON only — no markdown, no code fences, no explanation`;

function getFallbackConfig(description: string) {
  return {
    niche: "Small Business",
    nicheEmoji: "🏪",
    businessName: "My Business",
    modules: ["bookings", "clients", "invoices", "inventory", "tasks", "publicPage"],
    terminology: {
      clients: "Clients",
      bookings: "Bookings",
      inventory: "Inventory",
      tasks: "Tasks",
    },
    services: ["Consultation", "Standard Service", "Premium Package", "Follow-up Session", "Express Service", "Monthly Retainer"],
    customClientFields: [
      { id: "f1", label: "Notes", type: "textarea", placeholder: "Any special notes about this client", required: false },
    ],
    customBookingFields: [
      { id: "b1", label: "Service Details", type: "textarea", placeholder: "Specific requirements for this booking", required: false },
    ],
    kanbanColumns: ["To Do", "In Progress", "Completed", "On Hold"],
    inventoryCategories: ["Supplies", "Equipment", "Materials", "Consumables", "Tools"],
    inventoryUnits: ["pcs", "kg", "litres", "boxes"],
    dashboardMetric: "Bookings today",
    greeting: "Ready to grow your business today?",
    suggestedTagline: "Professional service you can trust.",
    color: "purple",
    nextActionTemplates: [
      "You have {bookings} bookings scheduled today.",
      "{overdue} invoices are overdue and need follow-up.",
      "{lowStock} inventory items are running low.",
    ],
    sampleData: {
      clients: [
        { name: "Priya Sharma", phone: "9876543210", email: "priya@example.com", notes: "Regular client", customFields: {} },
        { name: "Rahul Mehta", phone: "9876543211", email: "rahul@example.com", notes: "New client", customFields: {} },
        { name: "Anjali Singh", phone: "9876543212", email: "anjali@example.com", notes: "Referred by Priya", customFields: {} },
      ],
      bookings: [
        { title: "Service Appointment — Priya Sharma", service: "Standard Service", notes: "First appointment", amount: 500, status: "confirmed" },
        { title: "Follow-up — Rahul Mehta", service: "Follow-up Session", notes: "Check-in meeting", amount: 300, status: "pending" },
        { title: "Consultation — Anjali Singh", service: "Consultation", notes: "Initial consultation", amount: 800, status: "confirmed" },
      ],
      inventory: [
        { name: "Basic Supplies", category: "Supplies", quantity: "10", unit: "pcs", lowStockThreshold: "3", sellingPrice: "200", costPrice: "150" },
        { name: "Primary Material", category: "Materials", quantity: "5", unit: "kg", lowStockThreshold: "2", sellingPrice: "450", costPrice: "300" },
      ],
      tasks: [
        { title: "Set up client database", priority: "high" },
        { title: "Create invoice template", priority: "normal" },
        { title: "Schedule first booking", priority: "normal" },
        { title: "Stock inventory", priority: "high" },
      ],
    },
  };
}

router.get("/config", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const [config] = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId)).limit(1);
    if (!config) { res.json(null); return; }
    res.json(config);
  } catch (err) {
    req.log.error({ err }, "Onboarding config error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const existing = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId)).limit(1);
    if (existing.length > 0 && existing[0].isCompleted) {
      res.json({ completed: true, config: existing[0] });
    } else {
      res.json({ completed: false });
    }
  } catch (err) {
    req.log.error({ err }, "Onboarding status error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/generate", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { description } = req.body;

    if (!description || description.trim().length < 10) {
      res.status(400).json({ error: "Bad Request", message: "Please provide a description (at least 10 characters)" });
      return;
    }

    let config: any = null;
    try {
      const aiResponse = await callAI(WORKSPACE_SYSTEM_PROMPT, description);
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[0]);
      }
    } catch (aiErr) {
      req.log.error({ aiErr }, "AI call failed, using fallback");
    }

    if (!config) config = getFallbackConfig(description);

    // Normalize: ensure services is top-level (not inside terminology)
    if (!config.services && config.terminology?.services) {
      config.services = config.terminology.services;
    }
    if (!Array.isArray(config.services)) config.services = [];
    if (!Array.isArray(config.kanbanColumns)) config.kanbanColumns = ["To Do", "In Progress", "Completed", "On Hold"];
    if (!Array.isArray(config.inventoryCategories)) config.inventoryCategories = ["Supplies", "Equipment", "Materials", "Consumables", "Tools"];
    if (!Array.isArray(config.inventoryUnits)) config.inventoryUnits = ["pcs", "kg", "litres", "boxes"];
    if (!Array.isArray(config.customClientFields)) config.customClientFields = [];
    if (!Array.isArray(config.customBookingFields)) config.customBookingFields = [];
    if (!Array.isArray(config.nextActionTemplates)) config.nextActionTemplates = [];
    if (!config.dashboardMetric) config.dashboardMetric = "Bookings today";
    if (!config.nicheEmoji) config.nicheEmoji = "🏪";

    const upsertData = {
      niche: config.niche || "Business",
      nicheEmoji: config.nicheEmoji,
      businessName: config.businessName || "My Business",
      modules: config.modules || ["bookings", "clients", "invoices", "inventory", "tasks", "publicPage"],
      terminology: config.terminology || {},
      services: config.services,
      customClientFields: config.customClientFields,
      customBookingFields: config.customBookingFields,
      customInventoryFields: config.customInventoryFields || [],
      kanbanColumns: config.kanbanColumns,
      inventoryCategories: config.inventoryCategories,
      inventoryUnits: config.inventoryUnits,
      dashboardMetric: config.dashboardMetric,
      nextActionTemplates: config.nextActionTemplates,
      greeting: config.greeting,
      sampleData: config.sampleData || {},
      suggestedTagline: config.suggestedTagline,
      color: config.color || "purple",
      updatedAt: new Date(),
    };

    const existing = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId)).limit(1);

    let savedConfig: any;
    if (existing.length > 0) {
      const [updated] = await db.update(workspaceConfigsTable).set(upsertData).where(eq(workspaceConfigsTable.userId, userId)).returning();
      savedConfig = updated;
    } else {
      const [inserted] = await db.insert(workspaceConfigsTable).values({ userId, ...upsertData, isCompleted: false }).returning();
      savedConfig = inserted;
    }

    res.json({ config: savedConfig, raw: config });
  } catch (err) {
    req.log.error({ err }, "Onboarding generate error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/complete", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const existing = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId)).limit(1);
    if (existing.length === 0) {
      res.status(404).json({ error: "Not Found", message: "No workspace config found" });
      return;
    }

    const workspaceConfig = existing[0];
    const sampleData = workspaceConfig.sampleData as any;

    // Create business if needed
    const existingBusiness = await db.select().from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
    if (existingBusiness.length === 0) {
      const slug = workspaceConfig.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Math.random().toString(36).substring(2, 7);
      await db.insert(businessesTable).values({
        userId,
        name: workspaceConfig.businessName,
        category: workspaceConfig.niche.toLowerCase().replace(/\s+/g, "_"),
        currency: "INR",
        slug,
      });
    }

    const freshBusiness = await db.select().from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);

    if (freshBusiness.length > 0) {
      const bId = freshBusiness[0].id;

      // Sample clients
      if (sampleData?.clients && Array.isArray(sampleData.clients)) {
        for (const client of sampleData.clients) {
          await db.insert(clientsTable).values({
            businessId: bId,
            name: client.name,
            phone: client.phone || null,
            email: client.email || null,
            notes: client.notes || null,
            customFields: client.customFields || {},
            tags: ["Sample"],
          });
        }
      }

      // Sample bookings
      if (sampleData?.bookings && Array.isArray(sampleData.bookings)) {
        const future = (days: number, h: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d; };
        const offsets = [1, 2, 3];
        for (let i = 0; i < sampleData.bookings.length; i++) {
          const b = sampleData.bookings[i];
          await db.insert(bookingsTable).values({
            businessId: bId,
            title: b.title,
            service: b.service || "Service",
            notes: b.notes || null,
            amount: String(b.amount || 0),
            status: b.status || "confirmed",
            scheduledAt: future(offsets[i] || 1, 10 + i * 2),
            duration: 60,
          });
        }
      }

      // Sample inventory
      if (sampleData?.inventory && Array.isArray(sampleData.inventory)) {
        for (const item of sampleData.inventory) {
          await db.insert(inventoryTable).values({
            businessId: bId,
            name: item.name,
            category: item.category || "Supplies",
            quantity: String(item.quantity || "0"),
            unit: item.unit || "pcs",
            lowStockThreshold: String(item.lowStockThreshold || "3"),
            sellingPrice: String(item.sellingPrice || "0"),
            costPrice: String(item.costPrice || "0"),
            description: item.description || null,
          });
        }
      }

      // Sample tasks
      if (sampleData?.tasks && Array.isArray(sampleData.tasks)) {
        for (let i = 0; i < sampleData.tasks.length; i++) {
          const t = sampleData.tasks[i];
          await db.insert(tasksTable).values({
            businessId: bId,
            title: t.title,
            priority: t.priority || "normal",
            status: "todo",
            position: i,
            subtasks: [],
            comments: [],
            recurring: "none",
          });
        }
      }
    }

    await db.update(workspaceConfigsTable).set({ isCompleted: true, updatedAt: new Date() }).where(eq(workspaceConfigsTable.userId, userId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Onboarding complete error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PATCH /api/onboarding/custom-fields — update custom field definitions
router.patch("/custom-fields", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { customClientFields, customBookingFields, customInventoryFields } = req.body;
    const upd: any = { updatedAt: new Date() };
    if (customClientFields !== undefined) upd.customClientFields = customClientFields;
    if (customBookingFields !== undefined) upd.customBookingFields = customBookingFields;
    if (customInventoryFields !== undefined) upd.customInventoryFields = customInventoryFields;
    await db.update(workspaceConfigsTable).set(upd).where(eq(workspaceConfigsTable.userId, userId));
    const [updated] = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, userId));
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Custom fields update error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
