import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Sparkles, Calendar, Users, FileText, CheckSquare, Package, TrendingUp,
  ArrowRight, Bell, Zap, X, ChevronDown, ChevronRight, Search,
  Plus, Activity, CheckCircle2, Clock, AlertTriangle, CornerDownRight,
  LayoutDashboard, Settings,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function timeAgo(date: string | Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── animated counter ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ── skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-border/60", className)} />;
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, rawValue, prefix = "", suffix = "", icon: Icon, iconColor, trend, loading }: {
  label: string; rawValue: number; prefix?: string; suffix?: string;
  icon: React.ElementType; iconColor: string; trend?: string; loading?: boolean;
}) {
  const animated = useCountUp(rawValue);
  if (loading) return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={cn("p-2 rounded-lg bg-current/10", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {prefix}{animated.toLocaleString("en-IN")}{suffix}
      </p>
      {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
    </div>
  );
}

// ── command palette ───────────────────────────────────────────────────────────

const CMD_ITEMS = [
  { group: "Navigate", label: "Dashboard",     icon: LayoutDashboard, href: "/dashboard" },
  { group: "Navigate", label: "Bookings",       icon: Calendar,        href: "/bookings" },
  { group: "Navigate", label: "Clients",        icon: Users,           href: "/clients" },
  { group: "Navigate", label: "Invoices",       icon: FileText,        href: "/invoices" },
  { group: "Navigate", label: "Tasks",          icon: CheckSquare,     href: "/tasks" },
  { group: "Navigate", label: "Settings",       icon: Settings,        href: "/settings" },
  { group: "Create",   label: "New Booking",    icon: Plus,            href: "/bookings" },
  { group: "Create",   label: "New Client",     icon: Plus,            href: "/clients" },
  { group: "Create",   label: "New Invoice",    icon: Plus,            href: "/invoices" },
  { group: "Create",   label: "New Task",       icon: Plus,            href: "/tasks" },
];

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [idx, setIdx]     = useState(0);
  const [, setLocation]   = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = CMD_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { if (open) { setQuery(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);

  const select = useCallback((item: typeof CMD_ITEMS[0]) => {
    setLocation(item.href); onClose();
  }, [setLocation, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { setIdx(i => Math.min(i + 1, filtered.length - 1)); e.preventDefault(); }
      if (e.key === "ArrowUp")   { setIdx(i => Math.max(i - 1, 0)); e.preventDefault(); }
      if (e.key === "Enter" && filtered[idx]) select(filtered[idx]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, idx, select, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setIdx(0); }}
            placeholder="Search pages, actions…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No results</p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.label}
              onClick={() => select(item)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                i === idx ? "bg-primary/10 text-primary" : "text-foreground hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">{item.group}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();

  // Workspace config from /api/onboarding/config
  const [workspace, setWorkspace] = useState<any>(null);
  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    fetch("/api/onboarding/config", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setWorkspace(d))
      .catch(() => {});
  }, []);

  const terminology = (workspace?.terminology as any) || {};

  // AI Weekly Digest (lazy-loaded only when digest banner is visible)
  const [aiDigest, setAiDigest] = useState<{ text: string; stats?: any } | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    if (!token) return;
    setDigestLoading(true);
    fetch("/api/ai/weekly-digest", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.digest) setAiDigest({ text: d.digest, stats: d.stats }); })
      .catch(() => {})
      .finally(() => setDigestLoading(false));
  }, []);

  // AI Next Best Action
  const [aiNextAction, setAiNextAction] = useState<{ type: string; message: string; href: string; priority: string } | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    if (!token) return;
    fetch("/api/ai/next-action", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.action) setAiNextAction(d.action); })
      .catch(() => {});
  }, []);

  // UI state
  const [digestDismissed, setDigestDismissed]         = useState(false);
  const [checklistOpen, setChecklistOpen]             = useState(true);
  const [checklistDismissed, setChecklistDismissed]   = useState(false);
  const [cmdOpen, setCmdOpen]                         = useState(false);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Onboarding checklist state (localStorage-backed)
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("nf_checklist") || "{}"); } catch { return {}; }
  });
  const toggleCheck = (key: string) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("nf_checklist", JSON.stringify(next));
      return next;
    });
  };

  const CHECKLIST = [
    { key: "profile",  label: "Complete your profile",    href: "/settings" },
    { key: "client",   label: "Add your first client",    href: "/clients" },
    { key: "booking",  label: "Create your first booking",href: "/bookings" },
    { key: "invoice",  label: "Send your first invoice",  href: "/invoices" },
    { key: "public",   label: "Share your public page",   href: "/settings" },
  ];
  const completedCount = CHECKLIST.filter(c => checked[c.key]).length;

  // Next best action — prefer AI result, fall back to stats-based
  const nba = (() => {
    if (aiNextAction) {
      const iconMap: Record<string, any> = {
        invoice: FileText, booking: Calendar, inventory: Package,
        task: AlertTriangle, default: Sparkles,
      };
      const colorMap: Record<string, string> = {
        high: "text-destructive", medium: "text-amber-400", low: "text-primary",
      };
      return {
        icon: iconMap[aiNextAction.type] || iconMap.default,
        color: colorMap[aiNextAction.priority] || "text-primary",
        text: aiNextAction.message,
        action: "Take action",
        href: aiNextAction.href,
      };
    }
    if (!stats) return null;
    const s = stats as any;
    if (s.pendingInvoices > 0) return {
      icon: FileText, color: "text-amber-400",
      text: `${s.pendingInvoices} pending invoice${s.pendingInvoices > 1 ? "s" : ""} totalling ${formatINR(s.pendingInvoicesAmount)}. Send reminders?`,
      action: "View Invoices", href: "/invoices",
    };
    if (s.overdueTasks > 0) return {
      icon: AlertTriangle, color: "text-destructive",
      text: `${s.overdueTasks} overdue task${s.overdueTasks > 1 ? "s" : ""} need attention.`,
      action: "View Tasks", href: "/tasks",
    };
    if (s.activeBookings > 0) return {
      icon: Calendar, color: "text-primary",
      text: `${s.activeBookings} upcoming booking${s.activeBookings > 1 ? "s" : ""} scheduled. Confirm with clients?`,
      action: "View Bookings", href: "/bookings",
    };
    return {
      icon: Sparkles, color: "text-primary",
      text: "Everything looks good! Add a new client or create a booking to get started.",
      action: "New Client", href: "/clients",
    };
  })();

  // Sparkline: fill in last 7 days with 0 if missing
  const sparkData = (() => {
    const s = stats as any;
    if (!s?.revenueLast7Days?.length) {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return { day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), revenue: 0 };
      });
    }
    return s.revenueLast7Days;
  })();

  const northStar = useCountUp((stats as any)?.totalRevenue ?? 0);

  return (
    <AppLayout>
      <AnimatePresence>
        {cmdOpen && <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />}
      </AnimatePresence>

      <div className="space-y-6 pb-8">

        {/* ── Topbar row: greeting + actions ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {greeting()}, {user?.name?.split(" ")[0] || "there"}.
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Here's your {workspace?.niche || "business"} overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline text-[10px] bg-background border border-border rounded px-1.5">⌘K</kbd>
            </button>
            <button className="p-2 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <Link href="/settings">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl text-xs font-semibold text-primary hover:bg-primary/20 transition-all">
                <Zap className="w-3 h-3" /> Upgrade
              </button>
            </Link>
          </div>
        </div>

        {/* ── AI Weekly digest banner ───────────────────────────────────────── */}
        {!digestDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                    AI Weekly Digest · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                  {digestLoading ? (
                    <div className="space-y-1.5">
                      <div className="h-3 bg-primary/10 rounded animate-pulse w-4/5" />
                      <div className="h-3 bg-primary/10 rounded animate-pulse w-3/5" />
                    </div>
                  ) : aiDigest ? (
                    <p className="text-sm text-foreground leading-relaxed">{aiDigest.text}</p>
                  ) : (
                    <p className="text-sm text-foreground">
                      {(stats as any)?.activeBookings ?? 0} active {terminology.bookings || "bookings"} ·{" "}
                      {(stats as any)?.totalClients ?? 0} {terminology.clients || "clients"} ·{" "}
                      {formatINR((stats as any)?.totalRevenue ?? 0)} total revenue
                    </p>
                  )}
                  {aiDigest?.stats && (
                    <div className="flex gap-4 mt-2">
                      {[
                        { label: "Completed", value: aiDigest.stats.completedBookings },
                        { label: "Revenue", value: `₹${(aiDigest.stats.totalRevenue || 0).toLocaleString("en-IN")}` },
                        { label: "New clients", value: aiDigest.stats.newClients },
                        { label: "Upcoming", value: aiDigest.stats.upcomingBookings },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center">
                          <p className="text-xs font-bold text-foreground">{value}</p>
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setDigestDismissed(true)} className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: `+ New ${terminology.bookings || "Booking"}`, href: "/bookings", primary: true },
            { label: `+ New ${terminology.clients || "Client"}`,   href: "/clients"  },
            { label: `+ New Invoice`,                              href: "/invoices" },
            { label: `View Today`,                                 href: "/bookings" },
          ].map(({ label, href, primary }) => (
            <Link key={label} href={href}>
              <button className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                primary
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                  : "bg-card border border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
              )}>
                {label}
              </button>
            </Link>
          ))}
        </div>

        {/* ── North Star metric ─────────────────────────────────────────────── */}
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Total Revenue — All Time
              </p>
              <p className="text-4xl font-bold text-foreground">
                ₹{northStar.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(stats as any)?.pendingInvoicesAmount > 0
                  ? `+ ${formatINR((stats as any).pendingInvoicesAmount)} pending`
                  : "All invoices up to date"}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
          </div>
        )}

        {/* ── Stat cards (staggered entrance) ──────────────────────────────── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[
            { label: workspace?.dashboardMetric || `Today's ${terminology.bookings || "Bookings"}`, rawValue: (stats as any)?.todayBookings ?? 0, icon: Calendar, iconColor: "text-primary", trend: "scheduled today" },
            { label: "Pending Invoices", rawValue: (stats as any)?.pendingInvoices ?? 0, icon: FileText, iconColor: "text-amber-400", trend: `${formatINR((stats as any)?.pendingInvoicesAmount ?? 0)} outstanding` },
            { label: `Active ${terminology.clients || "Clients"}`, rawValue: (stats as any)?.totalClients ?? 0, icon: Users, iconColor: "text-teal-400", trend: "total registered" },
            { label: `Overdue ${terminology.tasks || "Tasks"}`, rawValue: (stats as any)?.overdueTasks ?? 0, icon: AlertTriangle, iconColor: "text-destructive", trend: `${(stats as any)?.pendingTasks ?? 0} pending total` },
          ].map(card => (
            <motion.div
              key={card.label}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } } }}
            >
              <StatCard {...card} loading={isLoading} />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main grid: chart + right column ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue sparkline */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Revenue · Last 7 Days
              </h3>
            </div>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparkData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e1e24" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#555558", fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#555558", fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#141416", border: "1px solid #1e1e24", borderRadius: "10px", fontSize: 12 }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Line
                      type="monotone" dataKey="revenue" stroke="#7F77DD"
                      strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#7F77DD" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Next best action */}
            {nba && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center shrink-0", nba.color)}>
                  <nba.icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-foreground flex-1">{nba.text}</p>
                <Link href={nba.href}>
                  <button className="shrink-0 text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                    {nba.action} <ArrowRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Activity feed */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
                    <div className="flex-1"><Skeleton className="h-3 w-full mb-1.5" /><Skeleton className="h-2.5 w-16" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {((stats as any)?.recentActivity?.length ? (stats as any).recentActivity : []).map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      a.type === "booking" ? "bg-primary/15" : "bg-teal-500/15"
                    )}>
                      {a.type === "booking"
                        ? <Calendar className="w-3.5 h-3.5 text-primary" />
                        : <Users    className="w-3.5 h-3.5 text-teal-400" />}
                    </div>
                    <div>
                      <p className="text-xs text-foreground leading-snug">{a.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(a.time)}</p>
                    </div>
                  </div>
                ))}
                {!(stats as any)?.recentActivity?.length && (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
                )}
              </div>
            )}
            <Link href="/bookings" className="mt-4 text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View all activity <CornerDownRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ── Onboarding checklist ─────────────────────────────────────────── */}
        {!checklistDismissed && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setChecklistOpen(o => !o)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Get started with NicheFlow</span>
                <span className="text-xs text-muted-foreground bg-background border border-border rounded-full px-2.5 py-0.5">
                  {completedCount}/{CHECKLIST.length}
                </span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", checklistOpen && "rotate-180")} />
            </button>

            {/* Progress bar */}
            <div className="h-0.5 bg-border mx-6">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${(completedCount / CHECKLIST.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <AnimatePresence initial={false}>
              {checklistOpen && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-4 space-y-2">
                    {CHECKLIST.map(item => (
                      <div key={item.key} className="flex items-center gap-3 group">
                        <button
                          onClick={() => toggleCheck(item.key)}
                          className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                            checked[item.key]
                              ? "bg-primary border-primary"
                              : "border-border group-hover:border-primary/50"
                          )}
                        >
                          {checked[item.key] && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <Link href={item.href} className="flex-1">
                          <span className={cn(
                            "text-sm transition-colors",
                            checked[item.key]
                              ? "line-through text-muted-foreground"
                              : "text-foreground hover:text-primary"
                          )}>
                            {item.label}
                          </span>
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    <button
                      onClick={() => setChecklistDismissed(true)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Upcoming bookings list ────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Upcoming {terminology.bookings || "Bookings"}
            </h3>
            <Link href="/bookings" className="text-xs text-primary hover:text-primary/80 transition-colors">View all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {((stats as any)?.recentBookings?.length
                ? (stats as any).recentBookings
                : []
              ).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(b.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    {b.amount && <p className="text-sm font-semibold text-foreground">₹{Number(b.amount).toLocaleString("en-IN")}</p>}
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      b.status === "confirmed"  ? "bg-primary/20 text-primary"       :
                      b.status === "completed"  ? "bg-teal-500/20 text-teal-400"     :
                      b.status === "cancelled"  ? "bg-destructive/20 text-destructive" :
                      "bg-amber-400/20 text-amber-400"
                    )}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
              {!(stats as any)?.recentBookings?.length && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No bookings yet.{" "}
                  <Link href="/bookings" className="text-primary hover:underline">Create your first →</Link>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
