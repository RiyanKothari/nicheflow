import { Router } from "express";
import { db, businessesTable, workspaceConfigsTable, clientsTable, bookingsTable } from "@workspace/db";
import { publicPageConfigsTable, publicPageReviewsTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getBusinessId(userId: number) {
  const [b] = await db.select({ id: businessesTable.id }).from(businessesTable).where(eq(businessesTable.userId, userId)).limit(1);
  return b?.id ?? null;
}

async function getOrCreateConfig(businessId: number) {
  const [cfg] = await db.select().from(publicPageConfigsTable).where(eq(publicPageConfigsTable.businessId, businessId)).limit(1);
  if (cfg) return cfg;
  const [created] = await db.insert(publicPageConfigsTable).values({ businessId }).returning();
  return created;
}

async function getBusinessBySlug(slug: string) {
  const [b] = await db.select().from(businessesTable).where(eq(businessesTable.slug, slug)).limit(1);
  return b ?? null;
}

async function callAI(prompt: string): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.REPLIT_AI_URL;
  const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY  || process.env.OPENAI_API_KEY || "dummy";
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 400,
    }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || "";
}

// ── Authenticated: get own page config ────────────────────────────────────────

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(404).json({ error: "No business found" }); return; }

    const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId));
    const [ws]       = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, req.userId!));
    const config     = await getOrCreateConfig(businessId);
    const reviews    = await db.select().from(publicPageReviewsTable).where(eq(publicPageReviewsTable.businessId, businessId)).orderBy(desc(publicPageReviewsTable.createdAt));

    res.json({ business, config, ws, reviews });
  } catch (err: any) {
    req.log.error({ err }, "Get public page config error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Authenticated: update page config ─────────────────────────────────────────

router.put("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(404).json({ error: "No business found" }); return; }

    const {
      tagline, coverPhotoUrl, aboutText, showAbout, services,
      showServices, showContact, showReviews, showBookingWidget,
      accentColor, socialInstagram, socialFacebook, socialYoutube,
      whatsappEnabled, mapsLink,
      // business fields
      businessName, phone, email, address, city, slug,
    } = req.body;

    // Update business basic info if provided
    if (businessName || phone !== undefined || email !== undefined || address !== undefined || city !== undefined || slug !== undefined) {
      await db.update(businessesTable).set({
        ...(businessName && { name: businessName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(slug !== undefined && { slug }),
        updatedAt: new Date(),
      }).where(eq(businessesTable.id, businessId));
    }

    // Upsert page config
    const existing = await getOrCreateConfig(businessId);
    const [updated] = await db.update(publicPageConfigsTable).set({
      ...(tagline         !== undefined && { tagline }),
      ...(coverPhotoUrl   !== undefined && { coverPhotoUrl }),
      ...(aboutText       !== undefined && { aboutText }),
      ...(showAbout       !== undefined && { showAbout }),
      ...(services        !== undefined && { services }),
      ...(showServices    !== undefined && { showServices }),
      ...(showContact     !== undefined && { showContact }),
      ...(showReviews     !== undefined && { showReviews }),
      ...(showBookingWidget !== undefined && { showBookingWidget }),
      ...(accentColor     !== undefined && { accentColor }),
      ...(socialInstagram !== undefined && { socialInstagram }),
      ...(socialFacebook  !== undefined && { socialFacebook }),
      ...(socialYoutube   !== undefined && { socialYoutube }),
      ...(whatsappEnabled !== undefined && { whatsappEnabled }),
      ...(mapsLink        !== undefined && { mapsLink }),
      updatedAt: new Date(),
    }).where(eq(publicPageConfigsTable.businessId, businessId)).returning();

    res.json(updated);
  } catch (err: any) {
    req.log.error({ err }, "Update public page config error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Authenticated: analytics ───────────────────────────────────────────────────

router.get("/analytics", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    if (!businessId) { res.status(404).json({ error: "No business found" }); return; }

    const config  = await getOrCreateConfig(businessId);
    const reviews = await db.select().from(publicPageReviewsTable).where(eq(publicPageReviewsTable.businessId, businessId));
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

    res.json({
      viewCount: config.viewCount,
      reviewCount: reviews.length,
      avgRating,
    });
  } catch (err: any) {
    req.log.error({ err }, "Analytics error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Authenticated: toggle review visibility ────────────────────────────────────

router.patch("/reviews/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const businessId = await getBusinessId(req.userId!);
    const id = parseInt(req.params.id);
    const { isVisible } = req.body;
    await db.update(publicPageReviewsTable).set({ isVisible }).where(and(eq(publicPageReviewsTable.id, id), eq(publicPageReviewsTable.businessId, businessId!)));
    res.json({ ok: true });
  } catch (err: any) {
    req.log.error({ err }, "Toggle review error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Authenticated: AI generate tagline ────────────────────────────────────────

router.post("/ai/tagline", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { businessName, niche } = req.body;
    const text = await callAI(`Generate a short, punchy, memorable business tagline (max 10 words) for a ${niche || "small business"} called "${businessName || "My Business"}". Return only the tagline, no quotes, no explanation.`);
    res.json({ tagline: text.trim().replace(/^"|"$/g, "") });
  } catch (err: any) {
    req.log.error({ err }, "AI tagline error");
    res.status(500).json({ error: "AI unavailable" });
  }
});

// ── Authenticated: AI generate about ──────────────────────────────────────────

router.post("/ai/about", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { businessName, niche, city } = req.body;
    const text = await callAI(`Write a professional 2-3 paragraph "About Us" description for a ${niche || "small business"} called "${businessName || "My Business"}"${city ? ` based in ${city}` : ""}. Make it warm, trustworthy, and specific to this type of business. Return only the text.`);
    res.json({ about: text.trim() });
  } catch (err: any) {
    req.log.error({ err }, "AI about error");
    res.status(500).json({ error: "AI unavailable" });
  }
});

// ── PUBLIC: get page data ─────────────────────────────────────────────────────

router.get("/public/:slug", async (req, res) => {
  try {
    const business = await getBusinessBySlug(req.params.slug);
    if (!business) { res.status(404).json({ error: "Not Found" }); return; }

    const config  = await getOrCreateConfig(business.id);
    const reviews = await db.select().from(publicPageReviewsTable)
      .where(and(eq(publicPageReviewsTable.businessId, business.id), eq(publicPageReviewsTable.isVisible, true)))
      .orderBy(desc(publicPageReviewsTable.createdAt));

    // Increment view count (fire and forget)
    db.update(publicPageConfigsTable)
      .set({ viewCount: sql`${publicPageConfigsTable.viewCount} + 1` })
      .where(eq(publicPageConfigsTable.businessId, business.id))
      .catch(() => {});

    res.json({ business, config, reviews });
  } catch (err: any) {
    console.error("Get public page error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUBLIC: submit booking ─────────────────────────────────────────────────────

router.post("/public/:slug/book", async (req, res) => {
  try {
    const business = await getBusinessBySlug(req.params.slug);
    if (!business) { res.status(404).json({ error: "Not Found" }); return; }

    const { clientName, clientPhone, serviceName, servicePrice, scheduledAt, notes } = req.body;
    if (!clientName || !scheduledAt) { res.status(400).json({ error: "clientName and scheduledAt are required" }); return; }

    // Find or create client
    let clientId: number | null = null;
    if (clientPhone) {
      const [existing] = await db.select({ id: clientsTable.id }).from(clientsTable)
        .where(and(eq(clientsTable.businessId, business.id), eq(clientsTable.phone, clientPhone))).limit(1);
      if (existing) {
        clientId = existing.id;
      } else {
        const [newClient] = await db.insert(clientsTable).values({
          businessId: business.id, name: clientName, phone: clientPhone,
        }).returning({ id: clientsTable.id });
        clientId = newClient.id;
      }
    }

    const [booking] = await db.insert(bookingsTable).values({
      businessId: business.id,
      clientId,
      title: serviceName ? `${serviceName} — ${clientName}` : `Booking — ${clientName}`,
      description: notes || `Booked via public page`,
      scheduledAt: new Date(scheduledAt),
      amount: servicePrice ? String(servicePrice) : null,
      status: "pending",
    }).returning();

    res.status(201).json({ booking, message: "Booking confirmed! The business will get in touch with you shortly." });
  } catch (err: any) {
    console.error("Public book error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUBLIC: submit review ─────────────────────────────────────────────────────

router.post("/public/:slug/review", async (req, res) => {
  try {
    const business = await getBusinessBySlug(req.params.slug);
    if (!business) { res.status(404).json({ error: "Not Found" }); return; }

    const { clientName, rating, comment } = req.body;
    if (!clientName || !rating) { res.status(400).json({ error: "clientName and rating are required" }); return; }
    if (rating < 1 || rating > 5) { res.status(400).json({ error: "rating must be 1-5" }); return; }

    const [review] = await db.insert(publicPageReviewsTable).values({
      businessId: business.id, clientName, rating: Number(rating), comment: comment || null,
    }).returning();

    res.status(201).json({ review });
  } catch (err: any) {
    console.error("Public review error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
