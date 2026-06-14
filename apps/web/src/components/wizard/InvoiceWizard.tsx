import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Users, Plus, Minus, Calendar, Check, Loader2, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface InvoiceWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

interface LineItem { name: string; qty: number; rate: number; }

function authHeader() { return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" }; }

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("h-2 rounded-full transition-all duration-300",
          i < step ? "bg-primary w-6" : i === step ? "bg-primary w-5" : "bg-muted/40 w-3")} />
      ))}
    </div>
  );
}

const DEFAULT_SERVICES = ["Consultation", "Full Session", "Follow-up", "Monthly Package", "Home Visit", "Online Class", "Materials", "Labour"];

export function InvoiceWizard({ onClose, onCreated }: InvoiceWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedClient, setClient] = useState<any>(null);
  const [items, setItems] = useState<LineItem[]>([{ name: "", qty: 1, rate: 0 }]);
  const [taxPct, setTax] = useState(0);
  const [dueDate, setDue] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/clients?limit=50", { headers: authHeader() })
      .then(r => r.json()).then(d => setClients(d.clients || [])).catch(() => {});
  }, []);

  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const taxAmt   = Math.round(subtotal * taxPct / 100);
  const total    = subtotal + taxAmt;

  const addItem  = () => setItems(p => [...p, { name: "", qty: 1, rate: 0 }]);
  const removeItem = (i: number) => setItems(p => p.filter((_, j) => j !== i));
  const updateItem = (i: number, field: keyof LineItem, val: any) =>
    setItems(p => p.map((it, j) => j === i ? { ...it, [field]: val } : it));

  const steps = [
    t("invoices.wizard.step1Title"),
    t("invoices.wizard.step2Title"),
    t("invoices.wizard.step3Title"),
    t("invoices.wizard.step4Title"),
    t("invoices.wizard.step5Title"),
  ];

  const canNext = [
    !!selectedClient,
    items.some(it => it.name && it.rate > 0),
    true,
    !!dueDate,
    true,
  ][step];

  const save = async () => {
    setSaving(true);
    await fetch("/api/invoices", { method: "POST", headers: authHeader(), body: JSON.stringify({
      clientId: selectedClient?.id,
      items: items.filter(i => i.name && i.rate > 0),
      tax: taxPct,
      dueDate,
      notes,
      status: "pending",
    })});
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

          <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Step {step + 1} of {steps.length}</p>
              <h2 className="text-xl font-bold text-foreground mt-0.5">{steps[step]}</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/30 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <WizardProgress step={step} total={steps.length} />

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

                {/* Step 1 — Select Client */}
                {step === 0 && (
                  <div className="space-y-2">
                    {clients.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No clients yet.</p>}
                    {clients.map(c => (
                      <button key={c.id} onClick={() => setClient(c)}
                        className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                          selectedClient?.id === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{c.name?.charAt(0)}</div>
                        <div className="flex-1 min-w-0"><p className="font-semibold text-foreground truncate">{c.name}</p><p className="text-sm text-muted-foreground truncate">{c.phone || c.email}</p></div>
                        {selectedClient?.id === c.id && <Check className="w-5 h-5 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 2 — Add items */}
                {step === 1 && (
                  <div className="space-y-3">
                    {/* Quick service buttons */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {DEFAULT_SERVICES.slice(0, 4).map(s => (
                        <button key={s} onClick={() => { const empty = items.findIndex(i => !i.name); if (empty >= 0) updateItem(empty, "name", s); else addItem(); }}
                          className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                          + {s}
                        </button>
                      ))}
                    </div>
                    {items.map((item, i) => (
                      <div key={i} className="bg-background border border-border/60 rounded-2xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={item.name} onChange={e => updateItem(i, "name", e.target.value)} placeholder="Service / Item name"
                            className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground" />
                          {items.length > 1 && <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive transition-colors"><Minus className="w-4 h-4" /></button>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-muted/20 rounded-xl px-3 py-1.5">
                            <button onClick={() => updateItem(i, "qty", Math.max(1, item.qty - 1))} className="text-muted-foreground hover:text-foreground"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="text-sm font-medium text-foreground w-6 text-center">{item.qty}</span>
                            <button onClick={() => updateItem(i, "qty", item.qty + 1)} className="text-muted-foreground hover:text-foreground"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-muted-foreground text-sm">₹</span>
                            <input type="number" value={item.rate || ""} onChange={e => updateItem(i, "rate", Number(e.target.value))} placeholder="0"
                              className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-muted-foreground" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{fmt(item.qty * item.rate)}</span>
                        </div>
                      </div>
                    ))}
                    <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> {t("invoices.addItem")}
                    </button>
                  </div>
                )}

                {/* Step 3 — Amount review */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="bg-background border border-border rounded-2xl divide-y divide-border/40">
                      {items.filter(i => i.name && i.rate > 0).map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3">
                          <div><p className="text-sm font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">×{item.qty}</p></div>
                          <p className="text-sm font-semibold text-foreground">{fmt(item.qty * item.rate)}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Tax (%)</label>
                      <div className="flex gap-2">
                        {[0, 5, 12, 18].map(p => (
                          <button key={p} onClick={() => setTax(p)}
                            className={cn("flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                              taxPct === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
                            {p}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3 space-y-1.5">
                      <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                      {taxPct > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>Tax ({taxPct}%)</span><span>{fmt(taxAmt)}</span></div>}
                      <div className="flex justify-between text-base font-bold text-foreground border-t border-border/40 pt-1.5"><span>Total</span><span className="text-primary">{fmt(total)}</span></div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Due Date */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><Calendar className="w-8 h-8 text-primary" /></div>
                    <input type="date" value={dueDate} onChange={e => setDue(e.target.value)} min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-background border-2 border-border rounded-2xl px-4 py-4 text-foreground text-base [color-scheme:dark] focus:outline-none focus:border-primary/60" />
                    <div className="flex gap-2">
                      {[7, 14, 30].map(days => {
                        const d = new Date(); d.setDate(d.getDate() + days);
                        return <button key={days} onClick={() => setDue(d.toISOString().split("T")[0])}
                          className="flex-1 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                          {days === 7 ? "1 week" : days === 14 ? "2 weeks" : "1 month"}
                        </button>;
                      })}
                    </div>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("invoices.addNotes")} rows={3}
                      className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground text-sm resize-none focus:outline-none focus:border-primary/60 placeholder:text-muted-foreground" />
                  </div>
                )}

                {/* Step 5 — Confirm */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="bg-background border border-border rounded-2xl divide-y divide-border/40">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-primary" /></div>
                        <div><p className="text-xs text-muted-foreground">Client</p><p className="text-sm font-semibold text-foreground">{selectedClient?.name}</p></div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                        <div><p className="text-xs text-muted-foreground">Items</p><p className="text-sm font-semibold text-foreground">{items.filter(i => i.name).length} items</p></div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0"><span className="text-teal-400 font-bold text-sm">₹</span></div>
                        <div><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-extrabold text-foreground">{fmt(total)}</p></div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-primary" /></div>
                        <div><p className="text-xs text-muted-foreground">Due date</p><p className="text-sm font-semibold text-foreground">{dueDate ? new Date(dueDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" }) : ""}</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-background/40 shrink-0 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 border border-border rounded-2xl text-muted-foreground hover:text-foreground font-semibold transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t("common.back")}
              </button>
            )}
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-primary/90 transition-colors">
                {t("common.next")} <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-60 hover:bg-primary/90 transition-colors">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {t("invoices.wizard.send")}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
