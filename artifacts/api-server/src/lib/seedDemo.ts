/**
 * Auto-seeds the NicheFlow demo account on server startup.
 * Safe to run repeatedly — skips if demo@nicheflow.app already exists.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable, businessesTable, workspaceConfigsTable,
  clientsTable, bookingsTable, invoicesTable,
  inventoryTable, tasksTable,
  publicPageConfigsTable, publicPageReviewsTable,
} from "@workspace/db";
import { logger } from "./logger.js";

const DEMO_EMAIL = "demo@nicheflow.app";
const DEMO_PASS  = "demo1234";

const daysAgo     = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
const atHour = (base: Date, h: number, m = 0) => { const d = new Date(base); d.setHours(h, m, 0, 0); return d; };
const today  = (h: number) => atHour(new Date(), h);
const future = (days: number, h: number) => atHour(daysFromNow(days), h);
const past   = (days: number, h: number) => atHour(daysAgo(days), h);

export async function seedDemoIfNeeded() {
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, DEMO_EMAIL));
    if (existing) {
      logger.info("Demo account already seeded — skipping");
      return;
    }

    logger.info("Seeding demo account: Riya's K9 Academy");

    const passwordHash = await bcrypt.hash(DEMO_PASS, 10);
    const [user] = await db.insert(usersTable)
      .values({ email: DEMO_EMAIL, passwordHash, name: "Riya Sharma" })
      .returning();

    const [business] = await db.insert(businessesTable).values({
      userId: user.id, name: "Riya's K9 Academy",
      description: "Professional dog training in Chennai — patience, trust, results.",
      category: "Dog Trainer", phone: "+91 98765 43210", email: DEMO_EMAIL,
      address: "12, 3rd Cross Street, Anna Nagar", city: "Chennai",
      slug: "riyas-k9-academy", currency: "INR",
    }).returning();

    await db.insert(workspaceConfigsTable).values({
      userId: user.id, niche: "Dog Trainer", businessName: "Riya's K9 Academy",
      nicheEmoji: "🐕",
      modules: ["dashboard","bookings","clients","invoices","inventory","tasks","public-page","settings"],
      terminology: { clients: "Dogs & Owners", bookings: "Sessions", inventory: "Supplies", tasks: "Training Tasks" },
      greeting: "Hi Riya! You have bookings today.",
      suggestedTagline: "Professional dog training in Chennai — patience, trust, results.",
      color: "purple", isCompleted: true, language: "en",
      settings: {
        simpleMode: false, teamMembers: [], billing: { plan: "free" },
        notifications: { newBooking: true, invoiceOverdue: { whatsapp: true }, lowStock: true, taskDue: true, weeklyDigest: true },
        aiPrefs: { enabled: true, frequency: "balanced", tone: "friendly" },
        operatingHours: {
          monday: { open: true, from: "09:00", to: "18:00" },
          tuesday: { open: true, from: "09:00", to: "18:00" },
          wednesday: { open: true, from: "09:00", to: "18:00" },
          thursday: { open: true, from: "09:00", to: "18:00" },
          friday: { open: true, from: "09:00", to: "18:00" },
          saturday: { open: false, from: "10:00", to: "14:00" },
          sunday: { open: false, from: "10:00", to: "14:00" },
        },
        showInDirectory: true,
        dashboardWidgets: { revenueChart: true, upcomingBookings: true, recentClients: true, stockAlerts: true, aiInsights: true, quickActions: true },
        integrations: { razorpay: { keyId: "", keySecret: "" }, whatsapp: { connected: false }, instagram: { connected: false }, googleCalendar: { connected: false } },
      },
    });

    const clientSeeds = [
      { name: "Priya Menon",    phone: "9876543210", email: "priya@gmail.com",       tags: ["VIP"],      notes: "Bruno is a 2yr Labrador. Loves treats, responds well to clicker training. VIP client.",      customFields: { dog: "Bruno", breed: "Labrador", age: "2 yrs" } },
      { name: "Arjun Kumar",    phone: "8765432109", email: "arjun@gmail.com",        tags: ["New"],      notes: "Max is a 1yr German Shepherd. Still in puppy phase, high energy.",                          customFields: { dog: "Max", breed: "German Shepherd", age: "1 yr" } },
      { name: "Sneha Patel",    phone: "7654321098", email: "sneha@gmail.com",        tags: ["VIP"],      notes: "Bella is a 3yr Golden Retriever. Gentle, eager to please.",                                 customFields: { dog: "Bella", breed: "Golden Retriever", age: "3 yrs" } },
      { name: "Vivek Nair",     phone: "6543210987", email: "vivek@gmail.com",        tags: ["Regular"],  notes: "Shadow is a 4yr Rottweiler. Advanced training needed.",                                     customFields: { dog: "Shadow", breed: "Rottweiler", age: "4 yrs" } },
      { name: "Kavya Reddy",    phone: "9543218760", email: "kavya@gmail.com",        tags: ["New"],      notes: "Coco is a 1yr Toy Poodle. Timid, needs gentle approach.",                                  customFields: { dog: "Coco", breed: "Toy Poodle", age: "1 yr" } },
      { name: "Rahul Iyer",     phone: "8432109871", email: "rahul.iyer@gmail.com",   tags: ["Active"],   notes: "Rocky is a 2yr Doberman. Owner is experienced, dog is well-mannered.",                     customFields: { dog: "Rocky", breed: "Doberman", age: "2 yrs" } },
      { name: "Meena Krishnan", phone: "7321098762", email: "meena@gmail.com",        tags: ["Inactive"], notes: "Lily is a 3yr Beagle. Client paused training, follow up needed.",                          customFields: { dog: "Lily", breed: "Beagle", age: "3 yrs" } },
      { name: "Sanjay Shah",    phone: "6210987653", email: "sanjay@gmail.com",       tags: ["Overdue"],  notes: "Tiger is a 1yr Husky. Very high energy. Invoice overdue.",                                  customFields: { dog: "Tiger", breed: "Siberian Husky", age: "1 yr" } },
      { name: "Anita Desai",    phone: "9900112233", email: "anita.d@gmail.com",      tags: ["VIP"],      notes: "Cookie is a 2yr Shih Tzu. Anita is very involved — always on time.",                       customFields: { dog: "Cookie", breed: "Shih Tzu", age: "2 yrs" } },
      { name: "Vikram Singh",   phone: "9811223344", email: "vikram.s@gmail.com",     tags: ["Active"],   notes: "Rex is a 3yr Belgian Malinois. Police-dog breed. Needs precision training.",               customFields: { dog: "Rex", breed: "Belgian Malinois", age: "3 yrs" } },
      { name: "Pooja Menon",    phone: "8899001122", email: "pooja.m@gmail.com",      tags: ["New"],      notes: "Fluffy is a 5-month-old Maltese. First puppy, owner is excited but nervous.",              customFields: { dog: "Fluffy", breed: "Maltese", age: "5 months" } },
      { name: "Karan Mehta",    phone: "7788990011", email: "karan.m@gmail.com",      tags: ["Regular"],  notes: "Bolt is a 2yr Labrador mix. Karan trains at home between sessions — good progress.",       customFields: { dog: "Bolt", breed: "Labrador Mix", age: "2 yrs" } },
      { name: "Deepika Rao",    phone: "6677889900", email: "deepika.r@gmail.com",    tags: ["VIP"],      notes: "Luna is a 1yr Border Collie. Extremely intelligent, needs mental stimulation.",             customFields: { dog: "Luna", breed: "Border Collie", age: "1 yr" } },
      { name: "Amit Sharma",    phone: "9988776655", email: "amit.sh@gmail.com",      tags: ["Overdue"],  notes: "Duke is a 4yr Great Dane. Gentle giant but needs leash manners.",                          customFields: { dog: "Duke", breed: "Great Dane", age: "4 yrs" } },
      { name: "Ritika Kapoor",  phone: "8877665544", email: "ritika.k@gmail.com",     tags: ["New"],      notes: "Mochi is an 8-week-old Shih Tzu. Just starting puppy classes.",                           customFields: { dog: "Mochi", breed: "Shih Tzu", age: "8 weeks" } },
      { name: "Suresh Pillai",  phone: "7766554433", email: "suresh.p@gmail.com",     tags: ["Active"],   notes: "Thunder is a 2yr Doberman. Suresh does security work — needs professional obedience.",     customFields: { dog: "Thunder", breed: "Doberman", age: "2 yrs" } },
      { name: "Nandini Bose",   phone: "6655443322", email: "nandini.b@gmail.com",    tags: ["Inactive"], notes: "Simba is a 3yr Golden Retriever. Nandini relocated temporarily — resuming next month.",    customFields: { dog: "Simba", breed: "Golden Retriever", age: "3 yrs" } },
      { name: "Rohit Joshi",    phone: "9944332211", email: "rohit.j@gmail.com",      tags: ["Active"],   notes: "Buddy is a 1yr Beagle. Very playful. Rohit attends every session.",                       customFields: { dog: "Buddy", breed: "Beagle", age: "1 yr" } },
      { name: "Sunita Agarwal", phone: "8833221100", email: "sunita.a@gmail.com",     tags: ["Regular"],  notes: "Pepper is a 2yr Dachshund. Stubborn but improving week on week.",                         customFields: { dog: "Pepper", breed: "Dachshund", age: "2 yrs" } },
      { name: "Farhan Qureshi", phone: "7722110099", email: "farhan.q@gmail.com",     tags: ["New"],      notes: "Charlie is a 6-month-old Cocker Spaniel. First dog for the family.",                      customFields: { dog: "Charlie", breed: "Cocker Spaniel", age: "6 months" } },
    ];

    const clients = await db.insert(clientsTable).values(
      clientSeeds.map(c => ({ ...c, businessId: business.id }))
    ).returning();
    const [priya, arjun, sneha, vivek, kavya, rahul, , sanjay, anita, vikram, , karan, deepika, amit, , suresh] = clients;

    const SERVICES = ["One-on-One Session", "Group Class", "Puppy Training", "Behavior Consultation"];
    const bookingSeeds = [
      { clientId: priya.id,  title: `One-on-One Session — Priya Menon`,      service: SERVICES[0], scheduledAt: today(9),       status: "confirmed", amount: "800",  duration: 60 },
      { clientId: arjun.id,  title: `Puppy Training — Arjun Kumar`,          service: SERVICES[2], scheduledAt: today(11),      status: "confirmed", amount: "900",  duration: 60 },
      { clientId: sneha.id,  title: `One-on-One Session — Sneha Patel`,      service: SERVICES[0], scheduledAt: today(14),      status: "pending",   amount: "800",  duration: 60 },
      { clientId: vivek.id,  title: `Behavior Consultation — Vivek Nair`,    service: SERVICES[3], scheduledAt: today(16),      status: "pending",   amount: "1200", duration: 90 },
      { clientId: rahul.id,  title: `One-on-One Session — Rahul Iyer`,       service: SERVICES[0], scheduledAt: future(1, 10),  status: "confirmed", amount: "800",  duration: 60 },
      { clientId: kavya.id,  title: `Puppy Training — Kavya Reddy`,          service: SERVICES[2], scheduledAt: future(1, 15),  status: "confirmed", amount: "900",  duration: 60 },
      { clientId: priya.id,  title: `Group Class — Priya Menon`,             service: SERVICES[1], scheduledAt: future(2, 9),   status: "pending",   amount: "500",  duration: 90 },
      { clientId: arjun.id,  title: `Group Class — Arjun Kumar`,             service: SERVICES[1], scheduledAt: future(2, 9),   status: "pending",   amount: "500",  duration: 90 },
      { clientId: anita.id,  title: `One-on-One Session — Anita Desai`,      service: SERVICES[0], scheduledAt: future(3, 10),  status: "confirmed", amount: "800",  duration: 60 },
      { clientId: vikram.id, title: `Behavior Consultation — Vikram Singh`,  service: SERVICES[3], scheduledAt: future(3, 14),  status: "confirmed", amount: "1200", duration: 90 },
      { clientId: deepika.id,title: `Group Class — Deepika Rao`,             service: SERVICES[1], scheduledAt: future(4, 9),   status: "pending",   amount: "500",  duration: 90 },
      { clientId: karan.id,  title: `One-on-One Session — Karan Mehta`,      service: SERVICES[0], scheduledAt: future(5, 11),  status: "pending",   amount: "800",  duration: 60 },
      { clientId: suresh.id, title: `Advanced Training — Suresh Pillai`,     service: SERVICES[0], scheduledAt: future(6, 15),  status: "confirmed", amount: "1000", duration: 60 },
      { clientId: priya.id,  title: `One-on-One Session — Priya Menon`,      service: SERVICES[0], scheduledAt: past(1, 9),     status: "completed", amount: "800",  duration: 60 },
      { clientId: sneha.id,  title: `One-on-One Session — Sneha Patel`,      service: SERVICES[0], scheduledAt: past(2, 11),    status: "completed", amount: "800",  duration: 60 },
      { clientId: rahul.id,  title: `Behavior Consultation — Rahul Iyer`,    service: SERVICES[3], scheduledAt: past(3, 14),    status: "completed", amount: "1200", duration: 90 },
      { clientId: arjun.id,  title: `Puppy Training — Arjun Kumar`,          service: SERVICES[2], scheduledAt: past(5, 10),    status: "completed", amount: "900",  duration: 60 },
      { clientId: vivek.id,  title: `Advanced Training — Vivek Nair`,        service: SERVICES[0], scheduledAt: past(7, 15),    status: "completed", amount: "1000", duration: 60 },
      { clientId: anita.id,  title: `One-on-One Session — Anita Desai`,      service: SERVICES[0], scheduledAt: past(8, 10),    status: "completed", amount: "800",  duration: 60 },
      { clientId: kavya.id,  title: `Puppy Training — Kavya Reddy`,          service: SERVICES[2], scheduledAt: past(10, 9),    status: "completed", amount: "900",  duration: 60 },
      { clientId: vikram.id, title: `Group Class — Vikram Singh`,            service: SERVICES[1], scheduledAt: past(12, 11),   status: "completed", amount: "500",  duration: 90 },
      { clientId: deepika.id,title: `One-on-One Session — Deepika Rao`,      service: SERVICES[0], scheduledAt: past(14, 10),   status: "completed", amount: "800",  duration: 60 },
      { clientId: karan.id,  title: `Group Class — Karan Mehta`,             service: SERVICES[1], scheduledAt: past(15, 9),    status: "completed", amount: "500",  duration: 90 },
      { clientId: sanjay.id, title: `One-on-One Session — Sanjay Shah`,      service: SERVICES[0], scheduledAt: past(4, 11),    status: "cancelled", amount: "800",  duration: 60 },
      { clientId: amit.id,   title: `Behavior Consultation — Amit Sharma`,   service: SERVICES[3], scheduledAt: past(6, 14),    status: "cancelled", amount: "1200", duration: 90 },
    ];

    await db.insert(bookingsTable).values(
      bookingSeeds.map(b => ({ ...b, businessId: business.id, notes: `Scheduled for ${b.service}` }))
    );

    const invoiceSeeds = [
      { clientId: priya.id,   invoiceNumber: "INV-0001", status: "paid",    subtotal: "1600",  tax: "0",   total: "1600",  issuedAt: past(20, 10), dueDate: past(10, 10), paidAt: past(8, 10),  items: [{ name: "One-on-One Session", qty: 2, rate: 800, amount: 1600 }], notes: "Thank you for your support!" },
      { clientId: sneha.id,   invoiceNumber: "INV-0002", status: "paid",    subtotal: "2500",  tax: "0",   total: "2500",  issuedAt: past(18, 10), dueDate: past(8, 10),  paidAt: past(6, 10),  items: [{ name: "Monthly Training Package", qty: 1, rate: 2500, amount: 2500 }], notes: "Package includes 8 sessions." },
      { clientId: rahul.id,   invoiceNumber: "INV-0003", status: "paid",    subtotal: "3600",  tax: "0",   total: "3600",  issuedAt: past(25, 10), dueDate: past(15, 10), paidAt: past(12, 10), items: [{ name: "One-on-One Session", qty: 3, rate: 800, amount: 2400 }, { name: "Behavior Consultation", qty: 1, rate: 1200, amount: 1200 }], notes: "Paid via UPI." },
      { clientId: anita.id,   invoiceNumber: "INV-0004", status: "paid",    subtotal: "4500",  tax: "0",   total: "4500",  issuedAt: past(30, 10), dueDate: past(20, 10), paidAt: past(18, 10), items: [{ name: "Premium Package", qty: 1, rate: 4500, amount: 4500 }], notes: "VIP client discount applied." },
      { clientId: vikram.id,  invoiceNumber: "INV-0005", status: "paid",    subtotal: "2400",  tax: "432", total: "2832",  issuedAt: past(22, 10), dueDate: past(12, 10), paidAt: past(10, 10), items: [{ name: "Group Class", qty: 3, rate: 500, amount: 1500 }, { name: "Advanced Training", qty: 1, rate: 900, amount: 900 }], notes: "18% GST applied." },
      { clientId: deepika.id, invoiceNumber: "INV-0006", status: "paid",    subtotal: "1600",  tax: "0",   total: "1600",  issuedAt: past(16, 10), dueDate: past(6, 10),  paidAt: past(4, 10),  items: [{ name: "One-on-One Session", qty: 2, rate: 800, amount: 1600 }], notes: "Deepika always pays on time." },
      { clientId: arjun.id,   invoiceNumber: "INV-0007", status: "sent",    subtotal: "2700",  tax: "486", total: "3186",  issuedAt: past(5, 10),  dueDate: future(9, 10),  items: [{ name: "Puppy Training", qty: 3, rate: 900, amount: 2700 }], notes: "18% GST applied." },
      { clientId: karan.id,   invoiceNumber: "INV-0008", status: "sent",    subtotal: "1500",  tax: "0",   total: "1500",  issuedAt: past(3, 10),  dueDate: future(11, 10), items: [{ name: "Group Class", qty: 3, rate: 500, amount: 1500 }], notes: "3 group classes." },
      { clientId: kavya.id,   invoiceNumber: "INV-0009", status: "overdue", subtotal: "4500",  tax: "0",   total: "4500",  issuedAt: past(25, 10), dueDate: past(15, 10),   items: [{ name: "Premium Training Package", qty: 1, rate: 4500, amount: 4500 }], notes: "OVERDUE — please follow up immediately." },
      { clientId: sanjay.id,  invoiceNumber: "INV-0010", status: "overdue", subtotal: "1600",  tax: "0",   total: "1600",  issuedAt: past(20, 10), dueDate: past(10, 10),   items: [{ name: "One-on-One Session", qty: 2, rate: 800, amount: 1600 }], notes: "OVERDUE — Tiger's owner not responding." },
      { clientId: amit.id,    invoiceNumber: "INV-0011", status: "overdue", subtotal: "1200",  tax: "0",   total: "1200",  issuedAt: past(18, 10), dueDate: past(8, 10),    items: [{ name: "Behavior Consultation", qty: 1, rate: 1200, amount: 1200 }], notes: "OVERDUE — follow up via WhatsApp." },
      { clientId: vivek.id,   invoiceNumber: "INV-0012", status: "pending", subtotal: "1200",  tax: "0",   total: "1200",  issuedAt: past(2, 10),  dueDate: future(12, 10), items: [{ name: "Behavior Consultation", qty: 1, rate: 1200, amount: 1200 }], notes: "Initial consultation fee." },
      { clientId: suresh.id,  invoiceNumber: "INV-0013", status: "pending", subtotal: "800",   tax: "0",   total: "800",   issuedAt: past(1, 10),  dueDate: future(13, 10), items: [{ name: "One-on-One Session", qty: 1, rate: 800, amount: 800 }], notes: "Awaiting review." },
      { clientId: rahul.id,   invoiceNumber: "INV-0014", status: "draft",   subtotal: "800",   tax: "0",   total: "800",   issuedAt: new Date(),    dueDate: future(14, 10), items: [{ name: "Initial Assessment", qty: 1, rate: 800, amount: 800 }], notes: "Draft — review before sending." },
      { clientId: priya.id,   invoiceNumber: "INV-0015", status: "draft",   subtotal: "5000",  tax: "0",   total: "5000",  issuedAt: new Date(),    dueDate: future(30, 10), items: [{ name: "Monthly Package (April)", qty: 1, rate: 5000, amount: 5000 }], notes: "Monthly renewal — pending approval." },
    ];

    await db.insert(invoicesTable).values(
      invoiceSeeds.map(i => ({ ...i, businessId: business.id, discount: "0", discountType: "fixed", payments: [] }))
    );

    const inventorySeeds = [
      { name: "Dog Treats (Bulk)",      category: "Food",       quantity: "5",  unit: "kg",    lowStockThreshold: "2",  costPrice: "450",  sellingPrice: "650",  description: "Premium chicken treats." },
      { name: "Training Clickers",      category: "Equipment",  quantity: "8",  unit: "pcs",   lowStockThreshold: "3",  costPrice: "150",  sellingPrice: "200",  description: "Positive reinforcement clickers." },
      { name: "Standard Leashes",       category: "Equipment",  quantity: "4",  unit: "pcs",   lowStockThreshold: "2",  costPrice: "350",  sellingPrice: "500",  description: "6ft nylon leashes." },
      { name: "Agility Cones",          category: "Agility",    quantity: "12", unit: "pcs",   lowStockThreshold: "4",  costPrice: "80",   sellingPrice: "120",  description: "Bright orange cones." },
      { name: "Puppy Pads",             category: "Hygiene",    quantity: "3",  unit: "packs", lowStockThreshold: "5",  costPrice: "200",  sellingPrice: "280",  description: "Disposable training pads. LOW STOCK!" },
      { name: "Training Vests (Staff)", category: "Uniform",    quantity: "2",  unit: "pcs",   lowStockThreshold: "1",  costPrice: "800",  sellingPrice: "800",  description: "Branded K9 Academy vest. LOW STOCK!" },
      { name: "Tennis Balls",           category: "Toys",       quantity: "20", unit: "pcs",   lowStockThreshold: "8",  costPrice: "30",   sellingPrice: "50",   description: "Standard fetch balls." },
      { name: "Bite Sticks",            category: "Training",   quantity: "6",  unit: "pcs",   lowStockThreshold: "3",  costPrice: "500",  sellingPrice: "700",  description: "For bite work training." },
      { name: "Kong Toys",              category: "Toys",       quantity: "8",  unit: "pcs",   lowStockThreshold: "4",  costPrice: "350",  sellingPrice: "500",  description: "Durable chew toys." },
      { name: "First Aid Kit",          category: "Safety",     quantity: "1",  unit: "kit",   lowStockThreshold: "1",  costPrice: "600",  sellingPrice: "600",  description: "Pet first aid kit. LOW STOCK!" },
      { name: "Agility Tunnel",         category: "Agility",    quantity: "2",  unit: "pcs",   lowStockThreshold: "1",  costPrice: "2500", sellingPrice: "3200", description: "Collapsible training tunnel." },
      { name: "Dog Muzzles",            category: "Safety",     quantity: "4",  unit: "pcs",   lowStockThreshold: "2",  costPrice: "300",  sellingPrice: "450",  description: "Adjustable basket muzzles." },
      { name: "Slip Leads",             category: "Equipment",  quantity: "6",  unit: "pcs",   lowStockThreshold: "3",  costPrice: "200",  sellingPrice: "280",  description: "Nylon slip leads for training." },
      { name: "Treat Pouches",          category: "Equipment",  quantity: "0",  unit: "pcs",   lowStockThreshold: "2",  costPrice: "250",  sellingPrice: "350",  description: "Belt pouches for treats. OUT OF STOCK!" },
      { name: "Clicker Training Guide", category: "Education",  quantity: "10", unit: "pcs",   lowStockThreshold: "5",  costPrice: "120",  sellingPrice: "180",  description: "Printed training booklet for owners." },
      { name: "Graduation Certificates",category: "Education",  quantity: "15", unit: "pcs",   lowStockThreshold: "10", costPrice: "20",   sellingPrice: "20",   description: "Printed certificates for completed dogs." },
      { name: "Long Training Lead",     category: "Equipment",  quantity: "3",  unit: "pcs",   lowStockThreshold: "2",  costPrice: "500",  sellingPrice: "700",  description: "10m recall training lead." },
      { name: "Agility Weave Poles",    category: "Agility",    quantity: "1",  unit: "set",   lowStockThreshold: "1",  costPrice: "1800", sellingPrice: "2400", description: "6-pole weave set. LOW STOCK!" },
      { name: "Marker Flags",           category: "Agility",    quantity: "20", unit: "pcs",   lowStockThreshold: "8",  costPrice: "15",   sellingPrice: "25",   description: "Small coloured field markers." },
      { name: "Bandanas (Branded)",     category: "Merchandise",quantity: "12", unit: "pcs",   lowStockThreshold: "5",  costPrice: "60",   sellingPrice: "100",  description: "K9 Academy branded dog bandanas." },
    ];

    await db.insert(inventoryTable).values(
      inventorySeeds.map(i => ({ ...i, businessId: business.id }))
    );

    const taskSeeds = [
      { title: "Prepare agility course for Bruno's session",       priority: "high",   status: "todo",        dueDate: today(8),      clientId: priya.id,  description: "Set up 6-cone weave, tunnel, and ramp." },
      { title: "Follow up with Sneha re: package renewal",         priority: "high",   status: "todo",        dueDate: past(1, 10),   clientId: sneha.id,  description: "Sneha's 8-session package ends this week. Discuss renewal." },
      { title: "Restock training treats — urgent",                 priority: "urgent", status: "todo",        dueDate: today(12),                          description: "Dog treats below 5kg. Order 10kg from Chennai Pet Mart." },
      { title: "Send invoice reminder to Kavya Reddy",             priority: "urgent", status: "todo",        dueDate: past(2, 10),   clientId: kavya.id,  description: "INV-0009 is 15 days overdue. Call and WhatsApp." },
      { title: "Chase Sanjay Shah for overdue payment",            priority: "urgent", status: "todo",        dueDate: past(3, 10),   clientId: sanjay.id, description: "INV-0010 overdue. Last WhatsApp ignored." },
      { title: "Schedule Saturday group class",                    priority: "normal", status: "todo",        dueDate: future(3, 10),                      description: "Coordinate with 4 owners for Saturday 9 AM group class." },
      { title: "Review Arjun's training video",                    priority: "normal", status: "todo",        dueDate: future(4, 15), clientId: arjun.id,  description: "Watch the 10-min session video, give feedback." },
      { title: "Monthly accounts reconciliation",                  priority: "high",   status: "todo",        dueDate: past(5, 10),                        description: "Match all March invoices with payments." },
      { title: "Order new puppy pads",                             priority: "high",   status: "todo",        dueDate: today(17),                          description: "Puppy Pads stock at 3 packs — reorder 20 packs." },
      { title: "Draft April training schedule",                    priority: "normal", status: "todo",        dueDate: future(5, 10),                      description: "Plan the April schedule and share with all clients via WhatsApp." },
      { title: "Update Bruno's progress report",                   priority: "normal", status: "in_progress", dueDate: future(1, 18), clientId: priya.id,  description: "Monthly progress report for Priya. Include photos." },
      { title: "Design new group class flyer",                     priority: "normal", status: "in_progress", dueDate: future(2, 10),                      description: "Create a Canva flyer for the Saturday group class." },
      { title: "Update website with April services",               priority: "high",   status: "in_progress", dueDate: future(3, 12),                      description: "Add new pricing and April class schedule to public page." },
      { title: "Train new assistant on safety protocols",          priority: "high",   status: "in_progress", dueDate: future(4, 9),                       description: "Walk through emergency procedures with new part-time assistant." },
      { title: "Film Deepika's training session for testimonial",  priority: "normal", status: "in_progress", dueDate: future(5, 14), clientId: deepika.id,description: "Record Luna's recall training for Instagram content." },
      { title: "Completed onboarding for Anita Desai",            priority: "normal", status: "done",        dueDate: past(3, 10),   clientId: anita.id,  description: "Cookie's puppy assessment done. Package confirmed." },
      { title: "Sent INV-0001 to Priya Menon",                    priority: "normal", status: "done",        dueDate: past(20, 10),  clientId: priya.id,  description: "Invoice sent and paid." },
      { title: "Set up agility equipment for weekend class",       priority: "normal", status: "done",        dueDate: past(5, 8),                         description: "Tunnel, weave poles, and cones all set up." },
      { title: "Uploaded Kavya's session photos to Drive",         priority: "low",    status: "done",        dueDate: past(7, 12),   clientId: kavya.id,  description: "All March session photos backed up." },
      { title: "Completed behavior assessment for Vikram's Rex",   priority: "high",   status: "done",        dueDate: past(9, 14),   clientId: vikram.id, description: "Malinois assessment done. Advanced program recommended." },
      { title: "Ordered new agility tunnel",                       priority: "normal", status: "done",        dueDate: past(12, 10),                       description: "Collapsible tunnel ordered from Amazon. Delivered." },
      { title: "Waiting for Meena's callback",                     priority: "normal", status: "on_hold",     dueDate: future(7, 10), clientId: undefined, description: "Meena relocated. Called 2x — no answer. Try again next week." },
      { title: "Outdoor training setup pending rain",              priority: "low",    status: "on_hold",     dueDate: future(2, 9),                       description: "Rain forecast until Friday. Will reschedule outdoor agility." },
      { title: "New van purchase research",                        priority: "low",    status: "on_hold",     dueDate: future(30, 10),                     description: "Evaluating options for mobile training van. On hold — budget." },
      { title: "Instagram content calendar for April",             priority: "normal", status: "on_hold",     dueDate: future(6, 10),                      description: "Social media plan on hold — waiting for new flyer design." },
      { title: "Partnership discussion with Chennai Pet Mart",     priority: "normal", status: "on_hold",     dueDate: future(14, 10),                     description: "Discussing bulk treat supply deal. Awaiting their proposal." },
    ];

    await db.insert(tasksTable).values(
      taskSeeds.map((t, i) => ({
        ...t,
        businessId: business.id,
        position: i,
        subtasks: [],
        comments: [],
        recurring: "none",
        clientId: t.clientId ?? null,
      }))
    );

    await db.insert(publicPageConfigsTable).values({
      businessId: business.id,
      tagline: "Professional dog training in Chennai — patience, trust, results.",
      aboutText: "Riya Sharma is a certified dog trainer with 8+ years of experience. Specialising in positive reinforcement, Riya's K9 Academy has trained over 200 dogs — from hyperactive puppies to reactive adults.",
      showAbout: true,
      services: [
        { id: "1", name: "One-on-One Training",   description: "Personalised 1hr sessions.", price: 800,  duration: "60 min" },
        { id: "2", name: "Group Classes",         description: "Socialisation in a group.",  price: 500,  duration: "90 min" },
        { id: "3", name: "Puppy Training",        description: "Foundation for 8wk–6mo pups.", price: 900, duration: "60 min" },
        { id: "4", name: "Behavior Consultation", description: "Expert correction of problem behaviours.", price: 1200, duration: "90 min" },
        { id: "5", name: "Monthly Package",       description: "8 sessions — best value.", price: 5000, duration: "8 sessions" },
      ],
      showServices: true, showContact: true, showReviews: true, showBookingWidget: true,
      accentColor: "#7F77DD", whatsappEnabled: true, socialInstagram: "@riyas_k9_academy",
    });

    await db.insert(publicPageReviewsTable).values([
      { businessId: business.id, clientName: "Priya Menon",  rating: 5, comment: "Bruno was completely out of control. After 6 sessions with Riya, he sits, stays, and heels! Worth every rupee." },
      { businessId: business.id, clientName: "Arjun Kumar",  rating: 5, comment: "Riya is incredibly patient with Max. She explains exactly what she's doing and why. Improved so much in 4 weeks." },
      { businessId: business.id, clientName: "Sneha Patel",  rating: 4, comment: "Great trainer, very professional. Bella is so much calmer at home now. Highly recommend the monthly package." },
    ]);

    logger.info({ email: DEMO_EMAIL, business: business.name }, "Demo account seeded successfully");
  } catch (err) {
    logger.error({ err }, "Failed to seed demo account — server will continue");
  }
}
