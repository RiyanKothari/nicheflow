import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Plus, Search, Package, X, Loader2, ChevronRight, Trash2,
  AlertTriangle, LayoutGrid, List, TrendingDown, Edit2,
  ArrowUpCircle, ArrowDownCircle, Clock, BarChart2, Boxes,
  DollarSign, AlertCircle, CheckCircle2, History,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type Item = {
  id: number; name: string; description?: string; quantity: number; unit?: string;
  lowStockThreshold: number | null; costPrice: number | null; sellingPrice: number | null;
  category?: string; supplier?: string; supplierPhone?: string; restockNotes?: string;
  status: "healthy" | "low_stock" | "out_of_stock"; totalValue: number;
  createdAt: string; updatedAt: string;
};

type Movement = {
  id: number; action: string; quantity: number; balanceAfter: number; reason?: string; createdAt: string;
};

type Stats = {
  total: number; totalValue: number; lowStock: number; outOfStock: number;
  categoryBreakdown: { category: string; count: number; value: number }[];
  mostUsed: { name: string; unit?: string; used: number }[];
};

type WorkspaceConfig = {
  niche?: string;
  terminology?: { inventory?: string; categories?: string[]; units?: string[] };
};

// ── Niche defaults ────────────────────────────────────────────────────────────

const NICHE_CATEGORIES: Record<string, string[]> = {
  dog_trainer:  ["Treats", "Toys", "Leashes & Collars", "Training Aids", "Supplements", "Grooming"],
  urban_farmer: ["Seeds", "Fertilisers", "Soil & Compost", "Tools", "Containers", "Pest Control"],
  tailor:       ["Fabric", "Thread", "Buttons & Zips", "Lining", "Interfacing", "Notions"],
  photographer: ["Film", "Batteries", "Memory Cards", "Cleaning", "Backdrops", "Lighting"],
  contractor:   ["Hardware", "Fixtures", "Paint", "Electrical", "Plumbing", "Safety Gear"],
};

const DEFAULT_CATEGORIES = ["Raw Materials", "Consumables", "Tools", "Packaging", "Office Supplies", "Miscellaneous"];
const UNITS = ["pieces", "kg", "grams", "litres", "ml", "metres", "cm", "rolls", "packets", "bags", "boxes", "pairs", "sets", "custom"];

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}
function formatINR(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    healthy:      { icon: CheckCircle2, label: "Healthy",      cls: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
    low_stock:    { icon: AlertTriangle, label: "Low Stock",   cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
    out_of_stock: { icon: AlertCircle,  label: "Out of Stock", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  }[status] || { icon: CheckCircle2, label: status, cls: "bg-muted/20 text-muted-foreground border-border" };
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border", cfg.cls)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ── Item Form Panel ───────────────────────────────────────────────────────────

function ItemFormPanel({ open, onClose, onSuccess, editItem, categories, workspace }: {
  open: boolean; onClose: () => void; onSuccess: () => void;
  editItem: Item | null; categories: string[]; workspace: WorkspaceConfig | null;
}) {
  const isEdit = !!editItem;
  const [name, setName]           = useState("");
  const [description, setDesc]    = useState("");
  const [quantity, setQuantity]   = useState("0");
  const [unit, setUnit]           = useState("pieces");
  const [threshold, setThreshold] = useState("");
  const [costPrice, setCost]      = useState("");
  const [sellPrice, setSell]      = useState("");
  const [category, setCategory]   = useState("");
  const [customCat, setCustomCat] = useState("");
  const [supplier, setSupplier]   = useState("");
  const [supplierPhone, setSpPhone] = useState("");
  const [restockNotes, setRestock] = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (editItem) {
      setName(editItem.name); setDesc(editItem.description || "");
      setQuantity(editItem.quantity.toString()); setUnit(editItem.unit || "pieces");
      setThreshold(editItem.lowStockThreshold?.toString() || ""); setCost(editItem.costPrice?.toString() || "");
      setSell(editItem.sellingPrice?.toString() || ""); setCategory(editItem.category || "");
      setSupplier(editItem.supplier || ""); setSpPhone(editItem.supplierPhone || "");
      setRestock(editItem.restockNotes || "");
    } else {
      setName(""); setDesc(""); setQuantity("0"); setUnit("pieces");
      setThreshold(""); setCost(""); setSell(""); setCategory("");
      setSupplier(""); setSpPhone(""); setRestock(""); setCustomCat("");
    }
    setError("");
  }, [editItem, open]);

  const niche = workspace?.niche || "";
  const nicheCategories = NICHE_CATEGORIES[niche] || DEFAULT_CATEGORIES;
  const allCats = [...new Set([...nicheCategories, ...categories])];

  const save = async () => {
    setError(""); setSaving(true);
    try {
      const finalCat = category === "__custom__" ? customCat : category;
      const body = {
        name, description: description || undefined,
        quantity: Number(quantity), unit,
        lowStockThreshold: threshold ? Number(threshold) : undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        sellingPrice: sellPrice ? Number(sellPrice) : undefined,
        category: finalCat || undefined,
        supplier: supplier || undefined, supplierPhone: supplierPhone || undefined,
        restockNotes: restockNotes || undefined,
      };
      const res = await fetch(isEdit ? `/api/inventory/${editItem!.id}` : "/api/inventory", {
        method: isEdit ? "PUT" : "POST", headers: authHeader(), body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      onSuccess(); onClose();
    } catch { setError("Failed to save item. Please try again."); }
    setSaving(false);
  };

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
              <h2 className="font-semibold text-foreground">{isEdit ? "Edit Item" : "Add Inventory Item"}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">{error}</p>}

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Item Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chicken treats, Organic compost…"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">No category</option>
                  {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">+ Add custom category</option>
                </select>
                {category === "__custom__" && (
                  <input value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="Custom category name…"
                    className="mt-2 w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                )}
              </div>

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Quantity</label>
                  <input type="number" min="0" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Unit</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Low stock threshold */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  Low Stock Alert — notify when below
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} placeholder="e.g. 5"
                    className="w-28 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <span className="text-sm text-muted-foreground">{unit}</span>
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Cost Price (₹ per unit)</label>
                  <input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCost(e.target.value)} placeholder="0"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Selling Price (₹) — optional</label>
                  <input type="number" min="0" step="0.01" value={sellPrice} onChange={e => setSell(e.target.value)} placeholder="0"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Supplier</label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <input value={supplierPhone} onChange={e => setSpPhone(e.target.value)} placeholder="Phone number"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Brand, variant, specs…"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>

              {/* Restock notes */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Restock Notes</label>
                <textarea value={restockNotes} onChange={e => setRestock(e.target.value)} rows={2} placeholder="Order from X, minimum 10 units, lead time 3 days…"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-border">
              <button onClick={save} disabled={saving || !name.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                {isEdit ? "Update Item" : "Add Item"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Movement Modal ────────────────────────────────────────────────────────────

function MovementModal({ item, action, open, onClose, onSuccess }: {
  item: Item | null; action: "add" | "deduct"; open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason]     = useState("");
  const [saving, setSaving]     = useState(false);

  const deductReasons = ["Used in session", "Sold to client", "Damaged / spoiled", "Expired", "Other"];
  const addReasons    = ["Restocked from supplier", "Returned by client", "New purchase", "Other"];
  const reasons       = action === "deduct" ? deductReasons : addReasons;

  const save = async () => {
    if (!item) return;
    setSaving(true);
    await fetch(`/api/inventory/${item.id}/movement`, {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ action, quantity: Number(quantity), reason }),
    });
    setSaving(false); onSuccess(); onClose();
    setQuantity("1"); setReason("");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {action === "add"
                    ? <ArrowUpCircle className="w-5 h-5 text-teal-400" />
                    : <ArrowDownCircle className="w-5 h-5 text-amber-400" />}
                  <h3 className="font-bold text-foreground">
                    {action === "add" ? "Add Stock" : "Deduct Stock"}
                  </h3>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              {item && (
                <div className="bg-background border border-border/50 rounded-xl px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.quantity} {item.unit}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">Quantity ({item?.unit})</label>
                <input type="number" min="0.01" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {reasons.map(r => (
                    <button key={r} onClick={() => setReason(r)}
                      className={cn("py-1.5 px-2 rounded-xl text-xs font-medium border transition-all text-left",
                        reason === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      {r}
                    </button>
                  ))}
                </div>
                <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Or type a reason…"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <button onClick={save} disabled={saving}
                className={cn("w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                  action === "add"
                    ? "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20"
                    : "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20")}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {action === "add" ? "Add Stock" : "Deduct Stock"}
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Item Detail Panel ─────────────────────────────────────────────────────────

function ItemDetailPanel({ item, open, onClose, onAction, onEdit }: {
  item: Item | null; open: boolean; onClose: () => void;
  onAction: (item: Item, action: "add" | "deduct") => void;
  onEdit: (item: Item) => void;
}) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);
  const [aiPrediction, setAiPred]  = useState("");
  const [aiLoading, setAiLoading]  = useState(false);

  useEffect(() => {
    if (!item || !open) return;
    setLoadingMov(true);
    fetch(`/api/inventory/${item.id}/movements`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : [])
      .then(setMovements)
      .finally(() => setLoadingMov(false));
  }, [item, open]);

  const generatePrediction = async () => {
    if (!item) return;
    setAiLoading(true);
    // Calculate avg usage from movements
    const deductions = movements.filter(m => m.action === "deduct");
    const totalUsed = deductions.reduce((s, m) => s + m.quantity, 0);
    const daysSinceFirst = movements.length > 0
      ? Math.max(1, (Date.now() - new Date(movements[movements.length - 1].createdAt).getTime()) / 86400000)
      : 30;
    const dailyRate = totalUsed / daysSinceFirst;

    const prompt = dailyRate > 0
      ? `An inventory item "${item.name}" has ${item.quantity} ${item.unit || "units"} left. Daily usage rate: ${dailyRate.toFixed(2)} ${item.unit || "units"}/day. Give a brief, friendly 1-sentence insight about how long it'll last and when to restock. Be specific with numbers.`
      : `An inventory item "${item.name}" has ${item.quantity} ${item.unit || "units"} with no recent usage. Give a brief 1-sentence insight about slow-moving stock.`;

    try {
      const res = await fetch("/api/ai/insight", { method: "POST", headers: authHeader(), body: JSON.stringify({ prompt }) });
      const d = await res.json();
      setAiPred(d.insight || "");
    } catch {
      if (dailyRate > 0) {
        const daysLeft = item.quantity / dailyRate;
        setAiPred(`At the current rate of ${dailyRate.toFixed(1)} ${item.unit}/day, this item will last approximately ${Math.round(daysLeft)} more days.`);
      } else {
        setAiPred("This item hasn't been used recently. Consider whether it's still needed.");
      }
    }
    setAiLoading(false);
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-semibold text-foreground">{item.name}</h2>
                {item.category && <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(item)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stock level bar */}
              <div className="bg-background border border-border rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-3xl font-black text-foreground">{item.quantity}</p>
                    <p className="text-sm text-muted-foreground">{item.unit || "units"} in stock</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                {item.lowStockThreshold !== null && (
                  <div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (item.quantity / (item.lowStockThreshold * 3)) * 100)}%` }}
                        transition={{ duration: 0.8 }}
                        className={cn("h-full rounded-full", item.status === "healthy" ? "bg-teal-500" : item.status === "low_stock" ? "bg-amber-500" : "bg-red-500")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Alert threshold: {item.lowStockThreshold} {item.unit}</p>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onAction(item, "add")}
                  className="flex items-center justify-center gap-2 py-3 bg-teal-500/15 border border-teal-500/30 text-teal-400 rounded-xl text-sm font-semibold hover:bg-teal-500/25 transition-colors">
                  <ArrowUpCircle className="w-4 h-4" /> Add Stock
                </button>
                <button onClick={() => onAction(item, "deduct")}
                  className="flex items-center justify-center gap-2 py-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/25 transition-colors">
                  <ArrowDownCircle className="w-4 h-4" /> Deduct Stock
                </button>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {[
                  { label: "Cost Price", value: item.costPrice ? formatINR(item.costPrice) : "—" },
                  { label: "Selling Price", value: item.sellingPrice ? formatINR(item.sellingPrice) : "—" },
                  { label: "Total Value", value: formatINR(item.totalValue) },
                  { label: "Supplier", value: item.supplier || "—" },
                  { label: "Supplier Phone", value: item.supplierPhone ? (
                    <a href={`tel:${item.supplierPhone}`} className="text-primary hover:text-primary/80">{item.supplierPhone}</a>
                  ) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value as any}</span>
                  </div>
                ))}
              </div>

              {/* Restock notes */}
              {item.restockNotes && (
                <div className="bg-background border border-border/50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Restock Notes</p>
                  <p className="text-sm text-foreground leading-relaxed">{item.restockNotes}</p>
                </div>
              )}

              {/* AI prediction */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Insight</p>
                  <button onClick={generatePrediction} disabled={aiLoading}
                    className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate →"}
                  </button>
                </div>
                {aiPrediction
                  ? <p className="text-sm text-foreground leading-relaxed">{aiPrediction}</p>
                  : <p className="text-sm text-muted-foreground">Click "Generate" for a usage prediction.</p>}
              </div>

              {/* Movement history */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground text-sm">Stock History</h3>
                </div>
                {loadingMov ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : movements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No movements recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {movements.map(m => (
                      <div key={m.id} className="flex items-center gap-3 bg-background border border-border/50 rounded-xl px-4 py-3">
                        <div className={cn("p-1.5 rounded-lg", m.action === "add" ? "bg-teal-500/15" : "bg-amber-500/15")}>
                          {m.action === "add"
                            ? <ArrowUpCircle className="w-3.5 h-3.5 text-teal-400" />
                            : <ArrowDownCircle className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground capitalize">
                            {m.action === "add" ? "+" : "-"}{m.quantity} {item.unit}
                          </p>
                          {m.reason && <p className="text-xs text-muted-foreground truncate">{m.reason}</p>}
                          <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">→ {m.balanceAfter} {item.unit}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────

function AnalyticsSection({ stats }: { stats: Stats | null }) {
  const PIE_COLORS = ["hsl(var(--primary))", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];
  if (!stats) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Most Used This Month</h3>
        {stats.mostUsed.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.mostUsed} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="used" radius={4} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-muted-foreground py-8 text-center">No usage data this month</p>}
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 col-span-1 lg:col-span-2">
        <h3 className="text-sm font-semibold text-foreground mb-3">Category Breakdown (by value)</h3>
        {stats.categoryBreakdown.length > 0 ? (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={stats.categoryBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                  {stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatINR(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {stats.categoryBreakdown.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs text-muted-foreground flex-1 truncate">{cat.category}</span>
                  <span className="text-xs font-semibold text-foreground">{cat.count} items</span>
                  <span className="text-xs text-muted-foreground">{formatINR(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <p className="text-xs text-muted-foreground py-8 text-center">Add categories to see breakdown</p>}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Inventory() {
  const [items, setItems]           = useState<Item[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [workspace, setWorkspace]   = useState<WorkspaceConfig | null>(null);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<"table" | "card">("table");
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy]         = useState("updatedAt");
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState<Item | null>(null);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [movItem, setMovItem]       = useState<Item | null>(null);
  const [movAction, setMovAction]   = useState<"add" | "deduct">("add");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selected, setSelected]     = useState<Set<number>>(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("nf_token");
    const h = { Authorization: `Bearer ${token}` };
    const [inv, st, ws] = await Promise.all([
      fetch("/api/inventory", { headers: h }).then(r => r.ok ? r.json() : []),
      fetch("/api/inventory/stats", { headers: h }).then(r => r.ok ? r.json() : null),
      fetch("/api/onboarding/config", { headers: h }).then(r => r.ok ? r.json() : null),
    ]);
    setItems(inv); setStats(st); setWorkspace(ws);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const categories = [...new Set(items.map(i => i.category).filter(Boolean) as string[])];

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) list = list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.category || "").toLowerCase().includes(search.toLowerCase()) || (i.supplier || "").toLowerCase().includes(search.toLowerCase()));
    if (filterCat)    list = list.filter(i => i.category === filterCat);
    if (filterStatus) list = list.filter(i => i.status === filterStatus);
    list.sort((a, b) => {
      if (sortBy === "name")      return a.name.localeCompare(b.name);
      if (sortBy === "quantity")  return a.quantity - b.quantity;
      if (sortBy === "value")     return b.totalValue - a.totalValue;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list;
  }, [items, search, filterCat, filterStatus, sortBy]);

  const lowStockItems = items.filter(i => i.status !== "healthy");
  const niche = workspace?.niche || "";
  const inventoryLabel = workspace?.terminology?.inventory || "Inventory";

  const openEdit = (item: Item) => {
    setEditItem(item);
    setDetailItem(null);
    setShowForm(true);
  };

  const openMove = (item: Item, action: "add" | "deduct") => {
    setMovItem(item);
    setMovAction(action);
    setDetailItem(null);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} items?`)) return;
    await Promise.all([...selected].map(id =>
      fetch(`/api/inventory/${id}`, { method: "DELETE", headers: authHeader() })
    ));
    setSelected(new Set());
    fetchAll();
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{inventoryLabel}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{loading ? "Loading…" : `${items.length} items`}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowAnalytics(!showAnalytics)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                showAnalytics ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground")}>
              <BarChart2 className="w-4 h-4" /> Analytics
            </button>
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button onClick={() => setView("table")} className={cn("px-3 py-2 text-sm transition-colors", view === "table" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setView("card")} className={cn("px-3 py-2 text-sm transition-colors", view === "card" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => { setEditItem(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: Boxes,        label: "Total Items",   value: stats?.total ?? "—",        color: "bg-primary/10 text-primary" },
            { icon: DollarSign,   label: "Total Value",   value: formatINR(stats?.totalValue || 0), color: "bg-teal-500/10 text-teal-400" },
            { icon: AlertTriangle, label: "Low Stock",    value: stats?.lowStock ?? "—",     color: "bg-amber-500/10 text-amber-400" },
            { icon: AlertCircle,  label: "Out of Stock",  value: stats?.outOfStock ?? "—",   color: "bg-red-500/10 text-red-400" },
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

        {/* ── Analytics ── */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <AnalyticsSection stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Low stock alerts ── */}
        {lowStockItems.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-sm font-semibold text-amber-400">{lowStockItems.length} item{lowStockItems.length > 1 ? "s" : ""} need attention</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map(item => (
                <button key={item.id} onClick={() => setDetailItem(item)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer hover:opacity-90",
                    item.status === "out_of_stock"
                      ? "bg-red-500/15 border-red-500/30 text-red-400"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400")}>
                  {item.name} — {item.quantity} {item.unit}
                  {item.status === "out_of_stock" && <span className="text-red-300">(OUT)</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, categories, suppliers…"
              className="w-full pl-9 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="">All status</option>
              <option value="healthy">Healthy</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
              <option value="updatedAt">Recent</option>
              <option value="name">Name</option>
              <option value="quantity">Quantity</option>
              <option value="value">Value</option>
            </select>
          </div>
        </div>

        {/* ── Bulk actions ── */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
            <p className="text-sm font-medium text-primary">{selected.size} selected</p>
            <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 ml-auto">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="text-sm text-muted-foreground hover:text-foreground">
              Clear
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-primary/40" />
            </div>
            <p className="font-bold text-foreground text-lg mb-1">
              {search || filterCat || filterStatus ? "No items match filters" : `No ${inventoryLabel} yet`}
            </p>
            <p className="text-sm mb-5 text-center max-w-xs">
              {search || filterCat || filterStatus
                ? "Try adjusting your search or filters."
                : "Track your supplies, materials, and stock. Add your first item to get started."}
            </p>
            {!search && !filterCat && !filterStatus && (
              <button onClick={() => { setEditItem(null); setShowForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Add First Item
              </button>
            )}
          </div>
        ) : view === "table" ? (
          // ── Table view ──
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px]">
                <thead>
                  <tr className="border-b border-border bg-background/30">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(filtered.map(i => i.id)) : new Set())}
                        checked={selected.size === filtered.length && filtered.length > 0}
                        className="rounded" />
                    </th>
                    {["Item", "Category", "Quantity", "Status", "Cost", "Total Value", "Supplier", ""].map(h => (
                      <th key={h} className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id}
                      className={cn("border-b border-border/50 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer",
                        item.status === "out_of_stock" && "bg-red-500/3",
                        item.status === "low_stock" && "bg-amber-500/3")}>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded" />
                      </td>
                      <td className="px-3 py-3" onClick={() => setDetailItem(item)}>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        {item.description && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{item.description}</p>}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground" onClick={() => setDetailItem(item)}>{item.category || "—"}</td>
                      <td className="px-3 py-3" onClick={() => setDetailItem(item)}>
                        <p className="text-sm font-bold text-foreground">{item.quantity}</p>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                      </td>
                      <td className="px-3 py-3" onClick={() => setDetailItem(item)}><StatusBadge status={item.status} /></td>
                      <td className="px-3 py-3 text-sm text-muted-foreground" onClick={() => setDetailItem(item)}>
                        {item.costPrice ? formatINR(item.costPrice) : "—"}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-foreground" onClick={() => setDetailItem(item)}>
                        {item.totalValue > 0 ? formatINR(item.totalValue) : "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground" onClick={() => setDetailItem(item)}>{item.supplier || "—"}</td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openMove(item, "add")} title="Add stock"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10 transition-colors">
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => openMove(item, "deduct")} title="Deduct stock"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEdit(item)} title="Edit"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // ── Card view ──
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const pct = item.lowStockThreshold
                ? Math.min(100, (item.quantity / (item.lowStockThreshold * 3)) * 100)
                : Math.min(100, (item.quantity / Math.max(1, item.quantity)) * 100);
              return (
                <motion.div key={item.id} layout
                  onClick={() => setDetailItem(item)}
                  className={cn("bg-card border rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-all group",
                    item.status === "out_of_stock" ? "border-red-500/30" : item.status === "low_stock" ? "border-amber-500/30" : "border-border")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{item.name}</p>
                      {item.category && <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>}
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-2xl font-black text-foreground">{item.quantity}</p>
                      <p className="text-xs text-muted-foreground">{item.unit || "units"}</p>
                    </div>
                    {item.totalValue > 0 && (
                      <p className="text-sm font-semibold text-muted-foreground">{formatINR(item.totalValue)}</p>
                    )}
                  </div>
                  {/* Stock level bar */}
                  <div className="h-1.5 bg-muted/30 rounded-full mb-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className={cn("h-full rounded-full", item.status === "healthy" ? "bg-teal-500" : item.status === "low_stock" ? "bg-amber-500" : "bg-red-500")}
                    />
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openMove(item, "add")}
                      className="flex-1 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl text-xs font-medium hover:bg-teal-500/20 transition-colors flex items-center justify-center gap-1">
                      <ArrowUpCircle className="w-3.5 h-3.5" /> Add
                    </button>
                    <button onClick={() => openMove(item, "deduct")}
                      className="flex-1 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1">
                      <ArrowDownCircle className="w-3.5 h-3.5" /> Use
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="px-2.5 py-1.5 border border-border text-muted-foreground rounded-xl text-xs hover:text-foreground hover:border-primary/40 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals & panels ── */}
      <ItemFormPanel
        open={showForm} onClose={() => { setShowForm(false); setEditItem(null); }}
        onSuccess={() => { fetchAll(); if (detailItem) setDetailItem(null); }}
        editItem={editItem} categories={categories} workspace={workspace}
      />
      <ItemDetailPanel
        item={detailItem} open={!!detailItem} onClose={() => setDetailItem(null)}
        onAction={(item, action) => { openMove(item, action); }}
        onEdit={openEdit}
      />
      <MovementModal
        item={movItem} action={movAction} open={!!movItem}
        onClose={() => setMovItem(null)}
        onSuccess={() => {
          fetchAll();
          if (detailItem && movItem && detailItem.id === movItem.id) {
            fetch(`/api/inventory/${movItem.id}`, { headers: authHeader() })
              .then(r => r.ok ? r.json() : null).then(i => { if (i) setDetailItem(i); });
          }
          setMovItem(null);
        }}
      />
    </AppLayout>
  );
}
