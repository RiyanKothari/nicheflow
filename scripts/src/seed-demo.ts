/**
 * NicheFlow Demo Seed — Riya's K9 Academy
 * Run: pnpm --filter @workspace/scripts run seed-demo
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import {
  usersTable, businessesTable, workspaceConfigsTable,
  clientsTable, bookingsTable, invoicesTable,
  inventoryTable, tasksTable,
  publicPageConfigsTable, publicPageReviewsTable,
} from "@workspace/db";

// ── date helpers ──────────────────────────────────────────────────────────────
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
const atHour = (base: Date, h: number, m = 0) => {
  const d = new Date(base); d.setHours(h, m, 0, 0); return d;
};
const today  = (h: number) => atHour(new Date(), h);
const future = (days: number, h: number) => atHour(daysFromNow(days), h);
const past   = (days: number, h: number) => atHour(daysAgo(days), h);

// ── main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  Seeding NicheFlow demo data — Riya's K9 Academy\n");

  // ── 1. User ────────────────────────────────────────────────────────────────
  const DEMO_EMAIL = "demo@nicheflow.app";
  const DEMO_PASS  = "demo1234";
  const passwordHash = await bcrypt.hash(DEMO_PASS, 10);

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, DEMO_EMAIL));
  if (user) {
    await db.update(usersTable).set({ passwordHash, name: "Riya Sharma" }).where(eq(usersTable.id, user.id));
    console.log(`  ✓ User updated:   ${user.email} (id=${user.id})`);
  } else {
    [user] = await db.insert(usersTable).values({ email: DEMO_EMAIL, passwordHash, name: "Riya Sharma" }).returning();
    console.log(`  ✓ User created:   ${user.email} (id=${user.id})`);
  }

  // ── 2. Business ────────────────────────────────────────────────────────────
  let [business] = await db.select().from(businessesTable).where(eq(businessesTable.userId, user.id));
  const bizData = {
    userId: user.id, name: "Riya's K9 Academy",
    description: "Professional dog training in Chennai — patience, trust, results.",
    category: "Dog Trainer", phone: "+91 98765 43210", email: DEMO_EMAIL,
    address: "12, 3rd Cross Street, Anna Nagar", city: "Chennai",
    slug: "riyas-k9-academy", currency: "INR",
  };
  if (business) {
    await db.update(businessesTable).set(bizData).where(eq(businessesTable.id, business.id));
  } else {
    [business] = await db.insert(businessesTable).values(bizData).returning();
  }
  console.log(`  ✓ Business:       ${business.name} (id=${business.id})`);

  // ── 3. Workspace Config ────────────────────────────────────────────────────
  const [existingWC] = await db.select().from(workspaceConfigsTable).where(eq(workspaceConfigsTable.userId, user.id));
  const wcData = {
    userId: user.id, niche: "Dog Trainer", businessName: "Riya's K9 Academy",
    modules: ["dashboard","bookings","clients","invoices","inventory","tasks","public-page","settings"],
    terminology: { clients: "Dogs & Owners", bookings: "Sessions", inventory: "Supplies", tasks: "Training Tasks" },
    greeting: "Hi Riya! You have bookings today.",
    suggestedTagline: "Professional dog training in Chennai — patience, trust, results.",
    color: "purple", isCompleted: true, language: "en",
    settings: {
      simpleMode: false,
      notifications: { newBooking: true, invoiceOverdue: true, lowStock: true, taskDue: true },
      aiPreferences: { enabled: true, frequency: "balanced", tone: "friendly" },
    },
  };
  if (existingWC) {
    await db.update(workspaceConfigsTable).set(wcData).where(eq(workspaceConfigsTable.id, existingWC.id));
  } else {
    await db.insert(workspaceConfigsTable).values(wcData);
  }
  console.log(`  ✓ Workspace config set`);

  // ── Wipe existing data for clean reseed ────────────────────────────────────
  await db.delete(bookingsTable).where(eq(bookingsTable.businessId, business.id));
  await db.delete(invoicesTable).where(eq(invoicesTable.businessId, business.id));
  await db.delete(inventoryTable).where(eq(inventoryTable.businessId, business.id));
  await db.delete(tasksTable).where(eq(tasksTable.businessId, business.id));
  await db.delete(clientsTable).where(eq(clientsTable.businessId, business.id));
  await db.delete(publicPageReviewsTable).where(eq(publicPageReviewsTable.businessId, business.id));
  console.log(`  ✓ Cleared existing business data`);

  // ── 4. Clients (8) ─────────────────────────────────────────────────────────
  const clientSeeds = [
    { name: "Priya Menon",      phone: "9876543210", email: "priya@gmail.com",
      notes: "Bruno is a 2yr Labrador. Loves treats, responds well to clicker training. VIP client.",
      tags: ["VIP"], customFields: { dog: "Bruno", breed: "Labrador", age: "2 yrs" } },
    { name: "Arjun Kumar",      phone: "8765432109", email: "arjun@gmail.com",
      notes: "Max is a 1yr German Shepherd. Still in puppy phase, high energy.",
      tags: ["New"], customFields: { dog: "Max", breed: "German Shepherd", age: "1 yr" } },
    { name: "Sneha Patel",      phone: "7654321098", email: "sneha@gmail.com",
      notes: "Bella is a 3yr Golden Retriever. Gentle, eager to please.",
      tags: ["VIP"], customFields: { dog: "Bella", breed: "Golden Retriever", age: "3 yrs" } },
    { name: "Vivek Nair",       phone: "6543210987", email: "vivek@gmail.com",
      notes: "Shadow is a 4yr Rottweiler. Advanced training needed.",
      tags: ["Regular"], customFields: { dog: "Shadow", breed: "Rottweiler", age: "4 yrs" } },
    { name: "Kavya Reddy",      phone: "9543218760", email: "kavya@gmail.com",
      notes: "Coco is a 1yr Toy Poodle. Timid, needs gentle approach.",
      tags: ["New"], customFields: { dog: "Coco", breed: "Toy Poodle", age: "1 yr" } },
    { name: "Rahul Iyer",       phone: "8432109871", email: "rahul.iyer@gmail.com",
      notes: "Rocky is a 2yr Doberman. Owner is experienced, dog is well-mannered.",
      tags: ["Active"], customFields: { dog: "Rocky", breed: "Doberman", age: "2 yrs" } },
    { name: "Meena Krishnan",   phone: "7321098762", email: "meena@gmail.com",
      notes: "Lily is a 3yr Beagle. Client paused training, follow up needed.",
      tags: ["Inactive"], customFields: { dog: "Lily", breed: "Beagle", age: "3 yrs" } },
    { name: "Sanjay Shah",      phone: "6210987653", email: "sanjay@gmail.com",
      notes: "Tiger is a 1yr Husky. Very high energy, needs advanced handling. Invoice overdue.",
      tags: ["Overdue"], customFields: { dog: "Tiger", breed: "Siberian Husky", age: "1 yr" } },
  ];

  const clients = await db.insert(clientsTable).values(
    clientSeeds.map(c => ({ ...c, businessId: business.id }))
  ).returning();
  console.log(`  ✓ Clients (${clients.length}): ${clients.map(c => c.name).join(", ")}`);

  const [priya, arjun, sneha, vivek, kavya, rahul, , sanjay] = clients;

  // ── 5. Bookings (12) ──────────────────────────────────────────────────────
  const SERVICES = ["One-on-One Session", "Group Class", "Puppy Training", "Behavior Consultation"];
  const bookingSeeds = [
    { clientId: priya.id,  title: `One-on-One Session — ${priya.name}`,          service: SERVICES[0], scheduledAt: today(9),        status: "confirmed", amount: "800", duration: 60 },
    { clientId: arjun.id,  title: `Puppy Training — ${arjun.name}`,              service: SERVICES[2], scheduledAt: today(11),       status: "confirmed", amount: "900", duration: 60 },
    { clientId: sneha.id,  title: `One-on-One Session — ${sneha.name}`,          service: SERVICES[0], scheduledAt: today(14),       status: "pending",   amount: "800", duration: 60 },
    { clientId: vivek.id,  title: `Behavior Consultation — ${vivek.name}`,       service: SERVICES[3], scheduledAt: today(16),       status: "pending",   amount: "1200", duration: 90 },
    { clientId: rahul.id,  title: `One-on-One Session — ${rahul.name}`,          service: SERVICES[0], scheduledAt: future(1, 10),   status: "confirmed", amount: "800", duration: 60 },
    { clientId: kavya.id,  title: `Puppy Training — ${kavya.name}`,              service: SERVICES[2], scheduledAt: future(1, 15),   status: "confirmed", amount: "900", duration: 60 },
    { clientId: priya.id,  title: `Group Class — ${priya.name}`,                 service: SERVICES[1], scheduledAt: future(2, 9),    status: "pending",   amount: "500", duration: 90 },
    { clientId: arjun.id,  title: `Group Class — ${arjun.name}`,                 service: SERVICES[1], scheduledAt: future(2, 9),    status: "pending",   amount: "500", duration: 90 },
    { clientId: sneha.id,  title: `Behavior Consultation — ${sneha.name}`,       service: SERVICES[3], scheduledAt: future(3, 11),   status: "confirmed", amount: "1200", duration: 90 },
    { clientId: vivek.id,  title: `Advanced Training — ${vivek.name}`,           service: SERVICES[0], scheduledAt: future(5, 14),   status: "pending",   amount: "1000", duration: 60 },
    { clientId: priya.id,  title: `One-on-One Session — ${priya.name}`,          service: SERVICES[0], scheduledAt: past(2, 10),     status: "completed", amount: "800", duration: 60 },
    { clientId: rahul.id,  title: `Behavior Consultation — ${rahul.name}`,       service: SERVICES[3], scheduledAt: past(5, 16),     status: "completed", amount: "1200", duration: 90 },
  ];

  const bookings = await db.insert(bookingsTable).values(
    bookingSeeds.map(b => ({ ...b, businessId: business.id, notes: `Scheduled for ${b.service}` }))
  ).returning();
  console.log(`  ✓ Bookings (${bookings.length})`);

  // ── 6. Invoices (6) ───────────────────────────────────────────────────────
  const invoiceSeeds = [
    {
      clientId: priya.id, invoiceNumber: "INV-0001", status: "paid",
      items: [{ name: "One-on-One Session", qty: 2, rate: 800, amount: 1600 }],
      subtotal: "1600", tax: "0", total: "1600",
      issuedAt: past(20, 10), dueDate: past(10, 10), paidAt: past(8, 10),
      notes: "Thank you for your continued support!",
    },
    {
      clientId: sneha.id, invoiceNumber: "INV-0002", status: "paid",
      items: [{ name: "Monthly Training Package", qty: 1, rate: 2500, amount: 2500 }],
      subtotal: "2500", tax: "0", total: "2500",
      issuedAt: past(18, 10), dueDate: past(8, 10), paidAt: past(6, 10),
      notes: "Package includes 8 sessions.",
    },
    {
      clientId: arjun.id, invoiceNumber: "INV-0003", status: "pending",
      items: [
        { name: "Puppy Training Session", qty: 3, rate: 900, amount: 2700 },
        { name: "Training Clicker", qty: 1, rate: 150, amount: 150 },
      ],
      subtotal: "2850", tax: "513", total: "3363",
      issuedAt: past(5, 10), dueDate: future(9, 10),
      notes: "18% GST applied. Due in 9 days.",
    },
    {
      clientId: vivek.id, invoiceNumber: "INV-0004", status: "pending",
      items: [{ name: "Behavior Consultation", qty: 1, rate: 1200, amount: 1200 }],
      subtotal: "1200", tax: "0", total: "1200",
      issuedAt: past(3, 10), dueDate: future(11, 10),
      notes: "Initial consultation fee.",
    },
    {
      clientId: kavya.id, invoiceNumber: "INV-0005", status: "overdue",
      items: [{ name: "Premium Training Package", qty: 1, rate: 4500, amount: 4500 }],
      subtotal: "4500", tax: "0", total: "4500",
      issuedAt: past(25, 10), dueDate: past(15, 10),
      notes: "OVERDUE — Please follow up immediately.",
    },
    {
      clientId: rahul.id, invoiceNumber: "INV-0006", status: "draft",
      items: [{ name: "Initial Assessment", qty: 1, rate: 800, amount: 800 }],
      subtotal: "800", tax: "0", total: "800",
      issuedAt: new Date(), dueDate: future(14, 10),
      notes: "Draft — review before sending.",
    },
  ];

  const invoices = await db.insert(invoicesTable).values(
    invoiceSeeds.map(i => ({ ...i, businessId: business.id, discount: "0", discountType: "fixed", payments: [] }))
  ).returning();
  console.log(`  ✓ Invoices (${invoices.length}): ${invoices.map(i => `${i.invoiceNumber}(${i.status})`).join(", ")}`);

  // ── 7. Inventory (10) ─────────────────────────────────────────────────────
  const inventorySeeds = [
    { name: "Dog Treats (Bulk)",     category: "Food",       quantity: "5",  unit: "kg",     lowStockThreshold: "2",  costPrice: "450",  sellingPrice: "650",  description: "Premium chicken treats for training rewards." },
    { name: "Training Clickers",     category: "Equipment",  quantity: "8",  unit: "pcs",    lowStockThreshold: "3",  costPrice: "150",  sellingPrice: "200",  description: "Standard clicker for positive reinforcement." },
    { name: "Standard Leashes",      category: "Equipment",  quantity: "4",  unit: "pcs",    lowStockThreshold: "2",  costPrice: "350",  sellingPrice: "500",  description: "6ft nylon leashes, 3 colors available." },
    { name: "Agility Cones",         category: "Agility",    quantity: "12", unit: "pcs",    lowStockThreshold: "4",  costPrice: "80",   sellingPrice: "120",  description: "Bright orange training cones." },
    { name: "Puppy Pads",            category: "Hygiene",    quantity: "3",  unit: "packs",  lowStockThreshold: "5",  costPrice: "200",  sellingPrice: "280",  description: "Disposable training pads for puppies. LOW STOCK!" },
    { name: "Training Vests (Staff)",category: "Uniform",    quantity: "2",  unit: "pcs",    lowStockThreshold: "1",  costPrice: "800",  sellingPrice: "800",  description: "Branded Riya's K9 Academy vest. LOW STOCK!" },
    { name: "Tennis Balls",          category: "Toys",       quantity: "20", unit: "pcs",    lowStockThreshold: "8",  costPrice: "30",   sellingPrice: "50",   description: "Standard fetch training balls." },
    { name: "Bite Sticks",           category: "Training",   quantity: "6",  unit: "pcs",    lowStockThreshold: "3",  costPrice: "500",  sellingPrice: "700",  description: "For bite work and protection training." },
    { name: "Kong Toys",             category: "Toys",       quantity: "8",  unit: "pcs",    lowStockThreshold: "4",  costPrice: "350",  sellingPrice: "500",  description: "Durable chew toys for mental stimulation." },
    { name: "First Aid Kit",         category: "Safety",     quantity: "1",  unit: "kit",    lowStockThreshold: "1",  costPrice: "600",  sellingPrice: "600",  description: "Pet first aid kit. Needs restocking." },
  ];

  const inventory = await db.insert(inventoryTable).values(
    inventorySeeds.map(i => ({ ...i, businessId: business.id }))
  ).returning();
  console.log(`  ✓ Inventory (${inventory.length}) — Low stock: Puppy Pads, Training Vests, First Aid Kit`);

  // ── 8. Tasks (8) ──────────────────────────────────────────────────────────
  const taskSeeds = [
    { title: "Prepare agility course for Bruno's session",            priority: "high",   status: "todo",        dueDate: today(8),       clientId: priya.id,  description: "Set up 6-cone weave, tunnel, and ramp in the training yard." },
    { title: "Follow up with Sneha re: package renewal",              priority: "high",   status: "todo",        dueDate: past(1, 10),    clientId: sneha.id,  description: "Sneha's 8-session package ends this week. Discuss renewal options." },
    { title: "Restock training treats — urgent",                      priority: "urgent", status: "todo",        dueDate: today(12),                           description: "Dog treats below 5kg. Order at least 10kg from Chennai Pet Mart." },
    { title: "Send invoice reminder to Kavya Reddy",                  priority: "urgent", status: "todo",        dueDate: past(2, 10),    clientId: kavya.id,  description: "INV-0005 is 15 days overdue. Call and WhatsApp." },
    { title: "Update Bruno's progress report",                        priority: "normal", status: "in_progress", dueDate: future(1, 18),  clientId: priya.id,  description: "Monthly progress report for Priya. Include photos if available." },
    { title: "Schedule Saturday group class",                         priority: "normal", status: "todo",        dueDate: future(3, 10),                       description: "Coordinate with 4 owners for Saturday 9 AM group class." },
    { title: "Review Arjun's training video",                         priority: "normal", status: "todo",        dueDate: future(4, 15),  clientId: arjun.id,  description: "Watch the 10-min session video shared by Arjun, give feedback." },
    { title: "Monthly accounts reconciliation",                       priority: "high",   status: "todo",        dueDate: past(5, 10),                         description: "Match all June invoices with payments. Check INV-0005 status." },
  ];

  const tasks = await db.insert(tasksTable).values(
    taskSeeds.map((t, i) => ({ ...t, businessId: business.id, position: i, subtasks: [], comments: [], recurring: "none" }))
  ).returning();
  const overdue = tasks.filter(t => t.dueDate && t.dueDate < new Date() && t.status !== "completed");
  console.log(`  ✓ Tasks (${tasks.length}) — ${overdue.length} overdue`);

  // ── 9. Public Page ─────────────────────────────────────────────────────────
  const ppServices = [
    { id: "1", name: "One-on-One Training",     description: "Personalised 1hr sessions tailored to your dog's needs.", price: 800,  duration: "60 min" },
    { id: "2", name: "Group Classes",           description: "Socialisation and basic commands in a fun group setting.", price: 500,  duration: "90 min" },
    { id: "3", name: "Puppy Training",          description: "Foundation training for puppies 8 weeks – 6 months.",    price: 900,  duration: "60 min" },
    { id: "4", name: "Behavior Consultation",   description: "Expert diagnosis and correction of problem behaviours.",  price: 1200, duration: "90 min" },
    { id: "5", name: "Monthly Package",         description: "8 sessions per month — best value for dedicated owners.", price: 5000, duration: "8 sessions" },
  ];

  const [existingPP] = await db.select().from(publicPageConfigsTable).where(eq(publicPageConfigsTable.businessId, business.id));
  const ppData = {
    businessId: business.id,
    tagline: "Professional dog training in Chennai — patience, trust, results.",
    aboutText: "Riya Sharma is a certified dog trainer with 8+ years of experience in Chennai. Specialising in positive reinforcement, Riya's K9 Academy has trained over 200 dogs — from hyperactive puppies to reactive adults. We believe every dog can learn with the right guidance.",
    showAbout: true,
    services: ppServices,
    showServices: true, showContact: true, showReviews: true, showBookingWidget: true,
    accentColor: "#7F77DD", whatsappEnabled: true,
    socialInstagram: "@riyas_k9_academy",
  };
  if (existingPP) {
    await db.update(publicPageConfigsTable).set(ppData).where(eq(publicPageConfigsTable.id, existingPP.id));
  } else {
    await db.insert(publicPageConfigsTable).values(ppData);
  }

  // ── 10. Reviews (3) ───────────────────────────────────────────────────────
  await db.insert(publicPageReviewsTable).values([
    { businessId: business.id, clientName: "Priya Menon", rating: 5,
      comment: "Bruno was completely out of control when we started. After 6 sessions with Riya, he sits, stays, and even heels! Absolutely worth every rupee." },
    { businessId: business.id, clientName: "Arjun Kumar", rating: 5,
      comment: "Riya is incredibly patient with Max. She explains exactly what she's doing and why. Max has improved so much in just 4 weeks." },
    { businessId: business.id, clientName: "Sneha Patel", rating: 4,
      comment: "Great trainer, very professional. Bella is so much calmer at home now. Highly recommend the monthly package — great value." },
  ]);
  console.log(`  ✓ Public page + 3 reviews`);

  console.log("\n✅  Demo seed complete!");
  console.log(`   Email:    ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASS}`);
  console.log(`   Business: ${business.name}`);
  console.log(`   Public:   /p/riyas-k9-academy\n`);

  await pool.end();
}

seed().catch(err => { console.error("❌  Seed failed:", err); process.exit(1); });
