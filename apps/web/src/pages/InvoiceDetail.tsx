import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Printer, MessageSquare, Edit2, DollarSign, X,
  Loader2, Check, AlertCircle, Share2, ExternalLink, Clock,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────────────────────────

type Payment = { id: number; amount: number; method: string; date: string; note?: string };

type Invoice = {
  id: number; clientId: number | null; clientName: string | null;
  clientPhone?: string | null; clientEmail?: string | null; clientAddress?: string | null;
  invoiceNumber: string; status: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  subtotal: number; tax: number; discount: number; discountType: string;
  total: number; issuedAt: string; dueDate: string | null; paidAt: string | null;
  payments: Payment[]; notes: string | null; createdAt: string;
  business: { name: string; phone?: string; email?: string; address?: string; city?: string } | null;
};

// ── helpers ───────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}
function formatINR(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function daysOverdue(dueDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000));
}

const STATUS_STAMP: Record<string, { label: string; cls: string }> = {
  paid:      { label: "PAID",      cls: "border-teal-400 text-teal-400" },
  overdue:   { label: "OVERDUE",   cls: "border-red-400 text-red-400" },
  cancelled: { label: "CANCELLED", cls: "border-muted-foreground text-muted-foreground" },
  draft:     { label: "DRAFT",     cls: "border-muted-foreground text-muted-foreground" },
};

const PAYMENT_METHODS = ["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Other"];

// ── Payment modal ─────────────────────────────────────────────────────────────

function PaymentModal({ invoice, open, onClose, onSuccess }: {
  invoice: Invoice; open: boolean; onClose: () => void; onSuccess: () => void;
}) {
  const [amount, setAmount]   = useState(invoice.total.toFixed(2));
  const [method, setMethod]   = useState("UPI");
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote]       = useState("");
  const [saving, setSaving]   = useState(false);

  const paidSoFar = (invoice.payments || []).reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, invoice.total - paidSoFar);

  useEffect(() => { setAmount(outstanding.toFixed(2)); }, [outstanding]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/invoices/${invoice.id}/payment`, {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ amount: Number(amount), method, date, note }),
    });
    setSaving(false); onSuccess(); onClose();
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
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Record Payment</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-background border border-border rounded-xl p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span className="font-semibold">{formatINR(invoice.total)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Paid so far</span>
                  <span className="text-teal-400">{formatINR(paidSoFar)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
                  <span>Outstanding</span>
                  <span className={outstanding > 0 ? "text-amber-400" : "text-teal-400"}>{formatINR(outstanding)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Amount Received</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m} onClick={() => setMethod(m)}
                      className={cn("py-1.5 rounded-xl text-xs font-medium border transition-all",
                        method === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 [color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. UPI ref #..."
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Record
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Invoice print layout ───────────────────────────────────────────────────────

function InvoiceLayout({ invoice, isPublic = false }: { invoice: Invoice; isPublic?: boolean }) {
  const discountAmt = invoice.discountType === "percent"
    ? (invoice.subtotal * invoice.discount) / 100
    : invoice.discount;

  const stamp = STATUS_STAMP[invoice.status];
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== "paid";

  return (
    <div id="invoice-print" className="bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden">
      {/* Status banner */}
      {(invoice.status === "paid" || invoice.status === "overdue" || isOverdue) && (
        <div className={cn("px-6 py-2.5 text-center text-xs font-bold tracking-widest",
          invoice.status === "paid" ? "bg-teal-500 text-white" : "bg-red-500 text-white")}>
          {invoice.status === "paid" ? "✓ PAYMENT RECEIVED" : `⚠ OVERDUE — ${daysOverdue(invoice.dueDate!)} DAYS`}
        </div>
      )}

      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{invoice.business?.name || "Your Business"}</h1>
            {invoice.business?.address && <p className="text-sm text-gray-500 mt-0.5">{invoice.business.address}{invoice.business.city ? `, ${invoice.business.city}` : ""}</p>}
            {invoice.business?.phone && <p className="text-sm text-gray-500">{invoice.business.phone}</p>}
            {invoice.business?.email && <p className="text-sm text-gray-500">{invoice.business.email}</p>}
          </div>
          <div className="text-right relative">
            {stamp && (
              <div className={cn("absolute -top-2 -right-2 border-4 rounded-lg px-3 py-1 text-2xl font-black tracking-widest opacity-25 rotate-[-15deg]", stamp.cls)}>
                {stamp.label}
              </div>
            )}
            <p className="text-3xl font-black text-gray-900">INVOICE</p>
            <p className="text-lg font-mono text-gray-600 mt-1">{invoice.invoiceNumber}</p>
          </div>
        </div>

        {/* Dates + Client */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bill To</p>
            <p className="font-bold text-gray-900 text-lg">{invoice.clientName || "—"}</p>
            {invoice.clientPhone && <p className="text-sm text-gray-500">{invoice.clientPhone}</p>}
            {invoice.clientEmail && <p className="text-sm text-gray-500">{invoice.clientEmail}</p>}
            {invoice.clientAddress && <p className="text-sm text-gray-500">{invoice.clientAddress}</p>}
          </div>
          <div className="space-y-2 text-right">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Issue Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(invoice.issuedAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Due Date</p>
              <p className={cn("text-sm font-medium", isOverdue ? "text-red-500 font-bold" : "text-gray-900")}>{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.paidAt && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Paid On</p>
                <p className="text-sm font-medium text-teal-600">{formatDate(invoice.paidAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</th>
                <th className="text-center pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-16">Qty</th>
                <th className="text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Unit Price</th>
                <th className="text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm text-gray-800">{item.description}</td>
                  <td className="py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-sm text-right text-gray-600">{formatINR(item.unitPrice)}</td>
                  <td className="py-3 text-sm text-right font-medium text-gray-900">{formatINR((item.quantity || 0) * (item.unitPrice || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatINR(invoice.subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount{invoice.discountType === "percent" ? ` (${invoice.discount}%)` : ""}</span>
                <span>-{formatINR(discountAmt)}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>GST</span><span>{formatINR(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl text-gray-900 border-t-2 border-gray-200 pt-3">
              <span>Total</span><span>{formatINR(invoice.total)}</span>
            </div>
            {invoice.payments.length > 0 && invoice.status !== "paid" && (
              <div className="flex justify-between text-sm text-amber-600 font-semibold">
                <span>Outstanding</span>
                <span>{formatINR(Math.max(0, invoice.total - invoice.payments.reduce((s, p) => s + p.amount, 0)))}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes & Terms</p>
            <p className="text-sm text-gray-600 leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
          <p className="text-xs text-gray-400">Thank you for your business.</p>
          {!isPublic && <p className="text-xs text-gray-300">Powered by NicheFlow</p>}
          {isPublic && <p className="text-xs text-gray-300">Powered by NicheFlow</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main Invoice Detail Page ───────────────────────────────────────────────────

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const [aiMsg, setAiMsg]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices/${id}`, { headers: authHeader() });
    if (res.ok) setInvoice(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [id]);

  const handleStatus = async (status: string) => {
    await fetch(`/api/invoices/${id}/status`, { method: "PATCH", headers: authHeader(), body: JSON.stringify({ status }) });
    fetch_();
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const url = `${window.location.origin}/invoice/public/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const generateReminder = async () => {
    if (!invoice) return;
    setAiLoading(true);
    const prompt = `Write a short, polite WhatsApp reminder message for an overdue invoice. Invoice number: ${invoice.invoiceNumber}. Amount: ₹${invoice.total}. Client: ${invoice.clientName || "Customer"}. Business: ${invoice.business?.name || "us"}. Keep it under 60 words, friendly and professional.`;
    try {
      const res = await fetch("/api/ai/insight", { method: "POST", headers: authHeader(), body: JSON.stringify({ prompt }) });
      const d = await res.json();
      setAiMsg(d.insight || "");
    } catch { setAiMsg(`Hi ${invoice.clientName || "there"}, this is a gentle reminder about Invoice ${invoice.invoiceNumber} for ₹${invoice.total} which is now overdue. Please let us know if you have any questions. Thank you!`); }
    setAiLoading(false);
  };

  const sendWhatsApp = (msg?: string) => {
    if (!invoice?.clientPhone) return;
    const phone = invoice.clientPhone.replace(/\D/g, "");
    const message = msg || `Hi ${invoice.clientName || "there"}, please find your invoice ${invoice.invoiceNumber} for ${formatINR(invoice.total)} from ${invoice.business?.name || "us"}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>;
  }
  if (!invoice) {
    return <AppLayout>
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg font-semibold text-foreground mb-2">Invoice not found</p>
        <Link href="/invoices"><button className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 mx-auto"><ArrowLeft className="w-4 h-4" />Back to invoices</button></Link>
      </div>
    </AppLayout>;
  }

  const paidSoFar = invoice.payments.reduce((s, p) => s + p.amount, 0);
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status !== "paid";

  return (
    <AppLayout>
      {/* Print-only styles */}
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      <div className="space-y-5 max-w-4xl mx-auto">
        {/* ── Toolbar ── */}
        <div className="no-print flex flex-wrap items-center gap-3">
          <Link href="/invoices">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Invoices
            </button>
          </Link>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button onClick={handleShare}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                copied ? "border-teal-500 text-teal-400 bg-teal-500/10" : "border-border text-muted-foreground hover:text-foreground")}>
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share Link"}
            </button>
            {invoice.clientPhone && (
              <button onClick={() => sendWhatsApp()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </button>
            )}
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            {invoice.status !== "paid" && (
              <button onClick={() => setShowPay(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all">
                <DollarSign className="w-4 h-4" /> Mark as Paid
              </button>
            )}
          </div>
        </div>

        {/* ── Status actions row ── */}
        <div className="no-print flex flex-wrap gap-2">
          {["draft","sent","viewed","overdue","cancelled"].filter(s => s !== invoice.status).map(s => (
            <button key={s} onClick={() => handleStatus(s)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors capitalize">
              Mark as {s}
            </button>
          ))}
        </div>

        {/* ── Overdue reminder ── */}
        {(isOverdue || invoice.status === "overdue") && (
          <div className="no-print bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400">
                  Overdue{invoice.dueDate ? ` — ${daysOverdue(invoice.dueDate)} days` : ""}
                </p>
                {invoice.clientPhone && (
                  <button onClick={generateReminder} disabled={aiLoading}
                    className="text-xs text-red-400/80 hover:text-red-400 flex items-center gap-1 mt-1 transition-colors">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                    Generate WhatsApp reminder
                  </button>
                )}
              </div>
            </div>
            {aiMsg && (
              <div className="bg-white/5 rounded-xl p-3 space-y-2">
                <p className="text-sm text-foreground leading-relaxed">{aiMsg}</p>
                <button onClick={() => sendWhatsApp(aiMsg)}
                  className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Send via WhatsApp
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Invoice layout ── */}
        <InvoiceLayout invoice={invoice} />

        {/* ── Payment history ── */}
        {invoice.payments.length > 0 && (
          <div className="no-print bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Payment History
            </h3>
            <div className="space-y-2">
              {invoice.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-background border border-border/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.method}</p>
                    {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(p.date)}</p>
                  </div>
                  <p className="text-sm font-bold text-teal-400">{formatINR(p.amount)}</p>
                </div>
              ))}
              {paidSoFar < invoice.total && (
                <div className="flex justify-between px-4 py-2 text-sm font-semibold text-amber-400">
                  <span>Outstanding balance</span>
                  <span>{formatINR(invoice.total - paidSoFar)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <PaymentModal invoice={invoice} open={showPay} onClose={() => setShowPay(false)} onSuccess={fetch_} />
    </AppLayout>
  );
}
