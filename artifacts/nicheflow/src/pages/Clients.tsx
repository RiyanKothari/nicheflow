import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Plus, Search, Users, LayoutGrid, List, X, SlidersHorizontal,
  Loader2, Phone, Mail, TrendingUp, UserCheck, UserX, Sparkles,
  ChevronRight, Trash2, Tag, BarChart2, Star,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetClients, useCreateClient } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useEffect } from "react";

// ── types ─────────────────────────────────────────────────────────────────────

type Client = {
  id: number; name: string; email?: string | null; phone?: string | null;
  address?: string | null; tags: string[]; totalSpent: number;
  bookingsCount: number; lastBookingAt?: string | null; createdAt: string;
};

type ViewMode = "table" | "cards" | "analytics";

const PREDEFINED_TAGS = ["VIP", "New", "Inactive", "Overdue", "Returning", "At-Risk"];

const TAG_COLORS: Record<string, string> = {
  VIP:       "bg-amber-400/20 text-amber-400 border-amber-400/30",
  New:       "bg-primary/20 text-primary border-primary/30",
  Inactive:  "bg-muted/40 text-muted-foreground border-border",
  Overdue:   "bg-red-500/20 text-red-400 border-red-500/30",
  Returning: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "At-Risk": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}

function avatarColor(name: string) {
  const colors = ["bg-primary", "bg-teal-500", "bg-amber-500", "bg-pink-500", "bg-violet-500", "bg-sky-500"];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatINR(n: number) {
  return n ? `₹${n.toLocaleString("en-IN")}` : "₹0";
}

// ── tag pill ──────────────────────────────────────────────────────────────────

function TagPill({ tag, small }: { tag: string; small?: boolean }) {
  const cls = TAG_COLORS[tag] || "bg-muted/40 text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center border rounded-full font-medium", small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5", cls)}>
      {tag}
    </span>
  );
}

// ── avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "md" ? "w-10 h-10 text-sm" : "w-14 h-14 text-lg";
  return (
    <div className={cn("rounded-full flex items-center justify-center text-white font-bold shrink-0", avatarColor(name), sz)}>
      {initials(name)}
    </div>
  );
}

// ── stat cards ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-4 flex items-center gap-3")}>
      <div className={cn("p-2.5 rounded-xl", color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── new client slide-in ───────────────────────────────────────────────────────

type CustomFieldDef = { id: string; label: string; type: string; placeholder?: string; required?: boolean; options?: string[] };

function renderCustomField(field: CustomFieldDef, value: string, onChange: (id: string, v: string) => void) {
  const base = "w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const chg = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(field.id, e.target.value);
  if (field.type === "textarea") return <textarea placeholder={field.placeholder} value={value} onChange={chg} rows={3} className={base + " resize-none"} />;
  if (field.type === "select" && field.options?.length) return (
    <select value={value} onChange={chg} className={base}>
      <option value="">Select…</option>
      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  if (field.type === "checkbox") return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={value === "true"} onChange={e => onChange(field.id, String(e.target.checked))} className="rounded border-border accent-primary w-4 h-4" />
      <span className="text-sm text-foreground">{field.label}</span>
    </label>
  );
  return <input type={field.type === "phone" ? "tel" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} placeholder={field.placeholder} value={value} onChange={chg} className={base} />;
}

function NewClientPanel({ open, onClose, onSuccess, customFields = [] }: { open: boolean; onClose: () => void; onSuccess: () => void; customFields?: CustomFieldDef[] }) {
  const { mutate: createClient, isPending } = useCreateClient();
  const [error, setError] = useState("");
  const [cfValues, setCfValues] = useState<Record<string, string>>({});

  const handleCfChange = (id: string, v: string) => setCfValues(prev => ({ ...prev, [id]: v }));

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError("");
    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    if (!name.trim()) { setError("Name is required."); return; }
    createClient({ data: { name, email: fd.get("email") as string || undefined, phone: fd.get("phone") as string || undefined, address: fd.get("address") as string || undefined, customFields: cfValues } as any }, {
      onSuccess: () => { onSuccess(); onClose(); setCfValues({}); },
      onError: () => setError("Failed to add client."),
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold">Add New Client</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">{error}</p>}
              {[
                { name: "name", label: "Full Name *", type: "text", placeholder: "e.g. Priya Sharma" },
                { name: "email", label: "Email", type: "email", placeholder: "priya@example.com" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
                { name: "address", label: "Address", type: "text", placeholder: "City, State" },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{f.label}</label>
                  <input required={f.name === "name"} name={f.name} type={f.type} placeholder={f.placeholder}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                </div>
              ))}

              {/* Dynamic custom fields */}
              {customFields.length > 0 && (
                <>
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Additional Details</p>
                  </div>
                  {customFields.map(field => (
                    <div key={field.id}>
                      {field.type !== "checkbox" && (
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {field.label}{field.required && " *"}
                        </label>
                      )}
                      {renderCustomField(field, cfValues[field.id] || "", handleCfChange)}
                    </div>
                  ))}
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Add Client
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── table view ────────────────────────────────────────────────────────────────

function TableView({ clients, selected, onSelect, onSelectAll, onDelete }: {
  clients: Client[]; selected: Set<number>;
  onSelect: (id: number) => void; onSelectAll: () => void; onDelete: (ids: number[]) => void;
}) {
  const allSelected = clients.length > 0 && clients.every(c => selected.has(c.id));
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-background/30">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={onSelectAll}
                  className="rounded border-border accent-primary" />
              </th>
              {["Name", "Phone / Email", "Tags", "Last Booking", "Total Spent", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className={cn("border-b border-border/50 last:border-b-0 hover:bg-white/5 transition-colors", selected.has(c.id) && "bg-primary/5")}>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(c.id)} onChange={() => onSelect(c.id)} className="rounded border-border accent-primary" />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`}>
                    <div className="flex items-center gap-3 cursor-pointer group">
                      <Avatar name={c.name} size="sm" />
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{c.name}</span>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <div className="space-y-0.5">
                    {c.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.phone}</div>}
                    {c.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</div>}
                    {!c.phone && !c.email && "—"}
                  </div>
                </td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{c.tags.slice(0, 2).map(t => <TagPill key={t} tag={t} small />)}</div></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(c.lastBookingAt)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatINR(c.totalSpent)}</td>
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`}>
                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── card view ─────────────────────────────────────────────────────────────────

function CardView({ clients }: { clients: Client[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {clients.map(c => (
        <Link key={c.id} href={`/clients/${c.id}`}>
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <Avatar name={c.name} size="lg" />
              <div className="flex flex-wrap gap-1 max-w-[100px] justify-end">
                {c.tags.slice(0, 2).map(t => <TagPill key={t} tag={t} small />)}
              </div>
            </div>
            <h3 className="font-bold text-foreground mb-0.5">{c.name}</h3>
            {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><Phone className="w-3 h-3" />{c.phone}</p>}
            {!c.phone && c.email && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><Mail className="w-3 h-3" />{c.email}</p>}
            {!c.phone && !c.email && <p className="text-xs text-muted-foreground mb-3">No contact info</p>}
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total spent</p>
                <p className="text-sm font-bold text-foreground">{formatINR(c.totalSpent)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Bookings</p>
                <p className="text-sm font-bold text-foreground">{c.bookingsCount}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {c.phone && (
                <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-xs font-medium text-center hover:bg-teal-500/20 transition-colors">
                  WhatsApp
                </a>
              )}
              <div className="flex-1 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium text-center hover:bg-primary/20 transition-colors">
                View Profile
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

// ── analytics view ────────────────────────────────────────────────────────────

function AnalyticsView({ clients }: { clients: Client[] }) {
  const [topRevenue, setTopRevenue] = useState<any[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    fetch("/api/clients/top-revenue", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setTopRevenue).catch(() => {});
  }, []);

  const total = clients.length;
  const newCount = clients.filter(c => {
    const d = new Date(c.createdAt); const now = new Date();
    return (now.getTime() - d.getTime()) < 30 * 24 * 60 * 60 * 1000;
  }).length;
  const returning = total - newCount;

  const pieData = [
    { name: "New", value: newCount, fill: "hsl(var(--primary))" },
    { name: "Returning", value: returning, fill: "#14b8a6" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top by revenue */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Top Clients by Revenue</h3>
        {topRevenue.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topRevenue} layout="vertical" margin={{ left: 0, right: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
              <Bar dataKey="totalSpent" radius={4}>
                {topRevenue.map((_, i) => <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* New vs returning */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" /> New vs Returning</h3>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No client data yet</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, "Clients"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-around text-center mt-2">
              {pieData.map(d => (
                <div key={d.name}>
                  <p className="text-lg font-bold text-foreground">{d.value}</p>
                  <p className="text-xs text-muted-foreground">{d.name}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Retention rate */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-2">Client Retention</h3>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold text-foreground">
            {total === 0 ? "0" : Math.round((returning / total) * 100)}%
          </span>
          <span className="text-sm text-teal-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />returning</span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: total === 0 ? "0%" : `${(returning / total) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{returning} of {total} clients have booked more than once</p>
      </div>

      {/* Tag breakdown */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4">Clients by Tag</h3>
        <div className="space-y-2">
          {PREDEFINED_TAGS.map(tag => {
            const count = clients.filter(c => c.tags.includes(tag)).length;
            return (
              <div key={tag} className="flex items-center gap-3">
                <TagPill tag={tag} />
                <div className="flex-1 bg-border rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: total === 0 ? "0%" : `${(count / total) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function Clients() {
  const qc = useQueryClient();
  const [view, setView]           = useState<ViewMode>("table");
  const [search, setSearch]       = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortBy, setSortBy]       = useState("date");
  const [showFilter, setShowFilter] = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [selected, setSelected]   = useState<Set<number>>(new Set());
  const [stats, setStats]         = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);

  const { data: clients = [], isLoading } = useGetClients({ search: search || undefined }) as { data: Client[]; isLoading: boolean };

  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    fetch("/api/clients/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setStats).catch(() => {});
    fetch("/api/onboarding/config", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setWorkspace).catch(() => {});
  }, []);

  const refetch = () => qc.invalidateQueries({ queryKey: ["/api/clients"] });

  const terminology = workspace?.terminology || {};
  const pageTitle = terminology.clients || "Clients";

  const filtered = useMemo(() => {
    let list = [...clients];
    if (tagFilter !== "all") list = list.filter(c => c.tags.includes(tagFilter));
    if (sortBy === "name")   list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "spent")  list.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sortBy === "date")   list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sortBy === "last")   list.sort((a, b) => (b.lastBookingAt ? new Date(b.lastBookingAt).getTime() : 0) - (a.lastBookingAt ? new Date(a.lastBookingAt).getTime() : 0));
    return list;
  }, [clients, tagFilter, sortBy]);

  const toggleSelect = (id: number) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () => setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)));

  const handleBulkDelete = async (ids: number[]) => {
    if (!confirm(`Delete ${ids.length} client(s)?`)) return;
    await Promise.all(ids.map(id => fetch(`/api/clients/${id}`, { method: "DELETE", headers: authHeader() })));
    setSelected(new Set()); refetch();
  };

  const handleBulkTag = async (tag: string) => {
    await Promise.all([...selected].map(async id => {
      const client = clients.find(c => c.id === id);
      if (!client) return;
      const newTags = client.tags.includes(tag) ? client.tags : [...client.tags, tag];
      await fetch(`/api/clients/${id}`, { method: "PUT", headers: authHeader(), body: JSON.stringify({ tags: newTags }) });
    }));
    setSelected(new Set()); refetch();
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${clients.length} total`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 gap-1">
              {([["table", List], ["cards", LayoutGrid], ["analytics", BarChart2]] as [ViewMode, any][]).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="w-3.5 h-3.5" />{v}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> Add Client
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users}      label="Total"          value={stats?.total ?? "—"}        color="bg-primary/10 text-primary" />
          <StatCard icon={Sparkles}   label="New this month" value={stats?.newThisMonth ?? "—"} color="bg-teal-500/10 text-teal-400" />
          <StatCard icon={UserCheck}  label="Active"         value={stats?.active ?? "—"}       color="bg-amber-500/10 text-amber-400" />
          <StatCard icon={UserX}      label="Inactive"       value={stats?.inactive ?? "—"}     color="bg-muted/40 text-muted-foreground" />
        </div>

        {/* ── Search + Filters ── */}
        {view !== "analytics" && (
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${pageTitle.toLowerCase()}…`}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <button onClick={() => setShowFilter(!showFilter)}
              className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
                showFilter ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>
            {showFilter && (
              <div className="w-full flex flex-wrap gap-2">
                <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="all">All tags</option>
                  {PREDEFINED_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="date">Sort: Date Added</option>
                  <option value="name">Sort: Name</option>
                  <option value="spent">Sort: Total Spent</option>
                  <option value="last">Sort: Last Visit</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* ── Bulk actions bar ── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
              <div className="flex gap-2 ml-auto">
                <select onChange={e => { if (e.target.value) handleBulkTag(e.target.value); }} defaultValue=""
                  className="bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none">
                  <option value="" disabled>Add tag…</option>
                  {PREDEFINED_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={() => handleBulkDelete([...selected])}
                  className="flex items-center gap-1.5 px-3 py-1 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg hover:bg-destructive/20">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 && view !== "analytics" ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-2xl text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-primary/60" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">No {pageTitle.toLowerCase()} yet</p>
            <p className="text-sm text-muted-foreground mb-6">Add your first client to get started</p>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Add First Client <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {view === "table" && <TableView clients={filtered} selected={selected} onSelect={toggleSelect} onSelectAll={toggleAll} onDelete={handleBulkDelete} />}
            {view === "cards" && <CardView clients={filtered} />}
            {view === "analytics" && <AnalyticsView clients={clients} />}
          </>
        )}
      </div>

      <NewClientPanel open={showNew} onClose={() => setShowNew(false)} onSuccess={refetch} customFields={(workspace?.customClientFields as CustomFieldDef[]) || []} />
    </AppLayout>
  );
}
