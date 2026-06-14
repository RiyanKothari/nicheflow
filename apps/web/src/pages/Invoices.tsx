import { useState, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Plus, Search, FileText, X, Loader2, ChevronRight, Trash2,
  TrendingUp, DollarSign, Clock, AlertCircle, BarChart2,
  Download, Filter, SlidersHorizontal, Eye, Send, Sparkles, Copy, Check,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetClients } from "@/hooks/data";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── types ─────────────────────────────────────────────────────────────────────

type LineItem = { description: string; quantity: number; unitPrice: number };

type Invoice = {
  id: number; clientId: number | null; clientName: string | null;
  invoiceNumber: string; status: string; items: LineItem[];
  subtotal: number; tax: number; discount: number; discountType: string;
  total: number; issuedAt: string; dueDate: string | null; paidAt: string | null;
  payments: any[]; notes: string | null; createdAt: string;
};

type Stats = {
  revenueThisMonth: number; outstanding: number; paidThisMonth: number;
  overdueCount: number; monthlyRevenue: { month: string; revenue: number }[];
};

// ── status config ─────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  draft:     { label: "Draft",     bg: "bg-muted/30",      text: "text-muted-foreground", border: "border-border" },
  sent:      { label: "Sent",      bg: "bg-blue-500/15",   text: "text-blue-400",         border: "border-blue-500/30" },
  viewed:    { label: "Viewed",    bg: "bg-violet-500/15", text: "text-violet-400",       border: "border-violet-500/30" },
  paid:      { label: "Paid",      bg: "bg-teal-500/15",   text: "text-teal-400",         border: "border-teal-500/30" },
  overdue:   { label: "Overdue",   bg: "bg-red-500/15",    text: "text-red-400",          border: "border-red-500/30" },
  cancelled: { label: "Cancelled", bg: "bg-muted/20",      text: "text-muted-foreground", border: "border-border" },
};

const TABS = ["all", "draft", "sent", "paid", "overdue"];

// ── helpers ───────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}
function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function daysOverdue(dueDate: string) {
  return Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] || STATUS.draft;
  return (
    <span className={cn("inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border", s.bg, s.text, s.border)}>
      {s.label}
    </span>
  );
}

// ── Line Items Editor ─────────────────────────────────────────────────────────

function LineItemsEditor({ items, onChange, services }: {
  items: LineItem[]; onChange: (items: LineItem[]) => void; services: string[];
}) {
  const update = (i: number, field: keyof LineItem, val: string | number) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { description: "", quantity: 1, unitPrice: 0 }]);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-3">Unit Price</div>
        <div className="col-span-1 text-right">Total</div>
        <div className="col-span-1" />
      </div>
      {items.map((item, i) => {
        const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
        return (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              {services.length > 0 ? (
                <input list={`svc-${i}`} value={item.description}
                  onChange={e => update(i, "description", e.target.value)}
                  placeholder="Service / item"
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
              ) : (
                <input value={item.description} onChange={e => update(i, "description", e.target.value)}
                  placeholder="Service / item"
                  className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
              )}
              <datalist id={`svc-${i}`}>{services.map(s => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="col-span-2">
              <input type="number" min="1" value={item.quantity}
                onChange={e => update(i, "quantity", Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="col-span-3">
              <input type="number" min="0" step="0.01" value={item.unitPrice}
                onChange={e => update(i, "unitPrice", Number(e.target.value))}
                className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="col-span-1 text-right text-sm font-medium text-foreground">
              {formatINR(lineTotal)}
            </div>
            <div className="col-span-1 flex justify-center">
              {items.length > 1 && (
                <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1">
        <Plus className="w-3.5 h-3.5" /> Add line item
      </button>
    </div>
  );
}

// ── New Invoice Panel ─────────────────────────────────────────────────────────

function NewInvoicePanel({ open, onClose, onSuccess, clients, services, bookings }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  clients: any[]; services: string[]; bookings: any[];
}) {
  const [items, setItems]         = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [taxPct, setTaxPct]       = useState(18);
  const [discount, setDiscount]   = useState(0);
  const [discType, setDiscType]   = useState<"fixed"|"percent">("fixed");
  const [clientSearch, setCS]     = useState("");
  const [selectedClient, setSC]   = useState("");
  const [duePreset, setDuePreset] = useState("30");
  const [customDue, setCustomDue] = useState("");
  const [notes, setNotes]         = useState("");
  const [invNum, setInvNum]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  // Recalc
  const subtotal     = items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0);
  const discountAmt  = discType === "percent" ? (subtotal * discount) / 100 : discount;
  const taxable      = Math.max(0, subtotal - discountAmt);
  const taxAmt       = (taxable * taxPct) / 100;
  const total        = taxable + taxAmt;

  const dueDateCalc = () => {
    if (duePreset === "custom") return customDue;
    const d = new Date(); d.setDate(d.getDate() + Number(duePreset));
    return d.toISOString().split("T")[0];
  };

  const save = async (status: "draft" | "sent") => {
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST", headers: authHeader(),
        body: JSON.stringify({
          clientId: selectedClient ? Number(selectedClient) : undefined,
          items, taxPct, discount, discountType: discType,
          dueDate: dueDateCalc(),
          notes, status,
          invoiceNumber: invNum || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      onSuccess(); onClose();
      setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    } catch { setError("Failed to create invoice."); }
    setSaving(false);
  };

  const importFromBooking = (b: any) => {
    setSC(b.clientId?.toString() || "");
    setItems([{ description: b.title, quantity: 1, unitPrice: b.amount || 0 }]);
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">New Invoice</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">{error}</p>}

              {/* Import from booking */}
              {bookings.filter(b => b.status !== "cancelled").length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Import from booking</label>
                  <select onChange={e => { const b = bookings.find(x => x.id === Number(e.target.value)); if (b) importFromBooking(b); }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Select a booking to auto-fill…</option>
                    {bookings.filter(b => b.clientId && b.amount).map(b => (
                      <option key={b.id} value={b.id}>{b.title} — {b.clientName} — {formatINR(b.amount)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Invoice # + Client */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Invoice Number</label>
                  <input value={invNum} onChange={e => setInvNum(e.target.value)} placeholder="Auto-generated"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Client</label>
                  <input value={clientSearch} onChange={e => setCS(e.target.value)} placeholder="Search…"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 mb-1" />
                  <select value={selectedClient} onChange={e => setSC(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">No client</option>
                    {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Due Date</label>
                <div className="flex gap-2 flex-wrap">
                  {[["7", "7 days"], ["15", "15 days"], ["30", "30 days"], ["custom", "Custom"]].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setDuePreset(v)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        duePreset === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      {l}
                    </button>
                  ))}
                </div>
                {duePreset === "custom" && (
                  <input type="date" value={customDue} onChange={e => setCustomDue(e.target.value)}
                    className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
                )}
              </div>

              {/* Line items */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Line Items</label>
                <LineItemsEditor items={items} onChange={setItems} services={services} />
              </div>

              {/* Discount + Tax */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Discount</label>
                  <div className="flex gap-2">
                    <input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))}
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <select value={discType} onChange={e => setDiscType(e.target.value as any)}
                      className="bg-background border border-border rounded-xl px-2 py-2 text-sm text-foreground focus:outline-none">
                      <option value="fixed">₹</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">GST %</label>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 5, 12, 18, 28].map(t => (
                      <button key={t} type="button" onClick={() => setTaxPct(t)}
                        className={cn("px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          taxPct === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                        {t}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-background border border-border rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span>{formatINR(subtotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-sm text-teal-400">
                    <span>Discount</span><span>-{formatINR(discountAmt)}</span>
                  </div>
                )}
                {taxAmt > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GST ({taxPct}%)</span><span>{formatINR(taxAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl text-foreground border-t border-border pt-2">
                  <span>Total</span><span>{formatINR(total)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Notes / Terms</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Payment terms, thank you note, etc."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>

            {/* Footer actions */}
            <div className="shrink-0 px-6 py-4 border-t border-border flex gap-3">
              <button onClick={() => save("draft")} disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null} Save as Draft
              </button>
              <button onClick={() => save("sent")} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Save & Send
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Analytics section ─────────────────────────────────────────────────────────

function AnalyticsSection({ stats, invoices }: { stats: Stats | null; invoices: Invoice[] }) {
  const paid = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const pieData = [
    { name: "Paid", value: paid, fill: "#14b8a6" },
    { name: "Outstanding", value: outstanding, fill: "hsl(var(--primary))" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Revenue</h3>
        {stats?.monthlyRevenue?.length ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.monthlyRevenue} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatINR(v), "Revenue"]} />
              <Bar dataKey="revenue" radius={4} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-muted-foreground py-8 text-center">No revenue data yet</p>}
      </div>
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Paid vs Outstanding</h3>
        {paid + outstanding > 0 ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={36} paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                  <div>
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                    <p className="text-sm font-bold text-foreground">{formatINR(d.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="text-xs text-muted-foreground py-8 text-center">No invoice data yet</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Invoices() {
  const qc = useQueryClient();
  const [invoices, setInvoices]   = useState<Invoice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [bookings, setBookings]   = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [tab, setTab]             = useState("all");
  const [search, setSearch]       = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const { data: clients = [] } = useGetClients() as { data: any[] };

  // AI reminder modal state
  const [reminderModal, setReminderModal] = useState<{ invoiceId: number; message: string; loading: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateReminder = async (invoiceId: number) => {
    setReminderModal({ invoiceId, message: "", loading: true });
    try {
      const res = await fetch("/api/ai/invoice-reminder", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      setReminderModal({ invoiceId, message: data.message || "Unable to generate message.", loading: false });
    } catch {
      setReminderModal({ invoiceId, message: "Sorry, could not generate reminder right now.", loading: false });
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    const token = localStorage.getItem("nf_token");
    const [inv, st, bk, ws] = await Promise.all([
      fetch("/api/invoices", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("/api/invoices/stats", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch("/api/bookings", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : []),
      fetch("/api/onboarding/config", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
    ]);
    setInvoices(inv); setStats(st); setBookings(bk); setWorkspace(ws);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const services: string[] = workspace?.terminology?.services || [];

  const filtered = useMemo(() => {
    let list = [...invoices];
    if (tab !== "all") list = list.filter(i => i.status === tab);
    if (search) list = list.filter(i => i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || (i.clientName || "").toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [invoices, tab, search]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE", headers: authHeader() });
    fetchInvoices();
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/invoices/${id}/status`, { method: "PATCH", headers: authHeader(), body: JSON.stringify({ status }) });
    fetchInvoices();
    if (status === "paid") {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 }, colors: ["#7F77DD", "#a78bfa", "#34d399", "#fbbf24"] });
    }
  };

  // Revenue forecast (sum of bookings not yet invoiced)
  const forecastTotal = bookings.filter(b => b.amount && b.status === "confirmed").reduce((s: number, b: any) => s + (b.amount || 0), 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{loading ? "Loading…" : `${invoices.length} total`}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowAnalytics(!showAnalytics)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                showAnalytics ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
              <BarChart2 className="w-4 h-4" /> Analytics
            </button>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> New Invoice
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: TrendingUp, label: "Revenue this month", value: formatINR(stats?.revenueThisMonth || 0), color: "bg-teal-500/10 text-teal-400" },
            { icon: Clock,       label: "Outstanding",        value: formatINR(stats?.outstanding || 0),        color: "bg-amber-500/10 text-amber-400" },
            { icon: DollarSign,  label: "Paid this month",   value: stats?.paidThisMonth ?? "—",               color: "bg-primary/10 text-primary" },
            { icon: AlertCircle, label: "Overdue",            value: stats?.overdueCount ?? "—",                color: "bg-red-500/10 text-red-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", color)}><Icon className="w-4 h-4" /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Revenue forecast ── */}
        {forecastTotal > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              Based on your confirmed bookings, you're on track to earn <strong>{formatINR(forecastTotal)}</strong> this period.
            </p>
          </div>
        )}

        {/* ── Analytics ── */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <AnalyticsSection stats={stats} invoices={invoices} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search + Tabs ── */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice # or client…"
              className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-card border border-border")}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Invoice table ── */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary/50" />
            </div>
            <p className="font-semibold text-foreground mb-1">No invoices {tab !== "all" ? `with status "${tab}"` : "yet"}</p>
            <p className="text-sm mb-5">Create your first invoice to start tracking revenue</p>
            <button onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-background/30">
                    {["Invoice #", "Client", "Amount", "Status", "Due Date", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => {
                    const isOverdue = inv.status === "overdue" || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status === "sent");
                    return (
                      <tr key={inv.id}
                        className={cn("border-b border-border/50 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer",
                          isOverdue && "bg-red-500/5")}>
                        <td className="px-4 py-3">
                          <Link href={`/invoices/${inv.id}`}>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="font-mono text-sm font-medium text-foreground hover:text-primary transition-colors">
                                {inv.invoiceNumber}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{inv.clientName || "—"}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{formatINR(inv.total)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={inv.status} />
                            {isOverdue && inv.dueDate && (
                              <span className="text-xs text-red-400">{daysOverdue(inv.dueDate)}d overdue</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Link href={`/invoices/${inv.id}`}>
                              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Eye className="w-4 h-4" />
                              </button>
                            </Link>
                            {(inv.status === "overdue" || inv.status === "sent" || inv.status === "pending") && (
                              <button onClick={() => generateReminder(inv.id)}
                                title="AI: Generate WhatsApp reminder"
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                                <Sparkles className="w-4 h-4" />
                              </button>
                            )}
                            {inv.status !== "paid" && (
                              <button onClick={() => handleStatusChange(inv.id, "paid")}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10 transition-colors" title="Mark paid">
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleDelete(inv.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <NewInvoicePanel
        open={showNew} onClose={() => setShowNew(false)} onSuccess={fetchInvoices}
        clients={clients} services={services} bookings={bookings}
      />

      {/* AI Reminder Modal */}
      <AnimatePresence>
        {reminderModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setReminderModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl pointer-events-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">AI Payment Reminder</p>
                      <p className="text-xs text-muted-foreground">Ready to paste into WhatsApp</p>
                    </div>
                  </div>
                  <button onClick={() => setReminderModal(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5">
                  {reminderModal.loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Generating reminder message...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-background border border-border rounded-xl p-4">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{reminderModal.message}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(reminderModal.message)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy to clipboard"}
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(reminderModal.message)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-sm font-semibold hover:bg-teal-500/30 transition-all"
                        >
                          <Send className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
