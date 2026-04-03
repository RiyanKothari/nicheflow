import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Calendar, Clock, User, Briefcase, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BookingWizardProps {
  onClose: () => void;
  onCreated: () => void;
}

function authHeader() { return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" }; }

function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("h-2 rounded-full transition-all duration-300",
          i < step ? "bg-primary w-8" : i === step ? "bg-primary w-6" : "bg-muted/40 w-4")} />
      ))}
    </div>
  );
}

const SERVICES = ["Consultation", "Full Session", "Follow-up", "Group Session", "Home Visit", "Online Session"];

export function BookingWizard({ onClose, onCreated }: BookingWizardProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLC] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedClient, setClient] = useState<any>(null);
  const [selectedService, setService] = useState("");
  const [selectedDate, setDate] = useState("");
  const [selectedTime, setTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setLC(true);
    fetch("/api/clients?limit=50", { headers: authHeader() })
      .then(r => r.json()).then(d => { setClients(d.clients || []); setLC(false); }).catch(() => setLC(false));
    // Pre-fill today's date
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const canNext = [
    !!selectedClient,
    !!selectedService,
    !!selectedDate && !!selectedTime,
    true,
  ][step];

  const save = async () => {
    setSaving(true);
    const dt = new Date(`${selectedDate}T${selectedTime || "09:00"}`);
    await fetch("/api/bookings", { method: "POST", headers: authHeader(), body: JSON.stringify({
      clientId: selectedClient?.id,
      title: `${selectedService} — ${selectedClient?.name}`,
      service: selectedService,
      scheduledAt: dt.toISOString(),
      notes,
      status: "confirmed",
    })});
    setSaving(false);
    onCreated();
    onClose();
  };

  const steps = [
    t("bookings.wizard.step1Title"),
    t("bookings.wizard.step2Title"),
    t("bookings.wizard.step3Title"),
    t("bookings.wizard.step4Title"),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Step {step + 1} of {steps.length}</p>
              <h2 className="text-xl font-bold text-foreground mt-0.5">{steps[step]}</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/30 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <WizardProgress step={step} total={steps.length} />

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

                {/* Step 1 — Select Client */}
                {step === 0 && (
                  <div className="space-y-3">
                    {loadingClients && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                    {clients.length === 0 && !loadingClients && (
                      <div className="text-center py-8 text-muted-foreground text-sm">No clients yet. Add a client first.</div>
                    )}
                    {clients.map(c => (
                      <button key={c.id} onClick={() => setClient(c)}
                        className={cn("w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          selectedClient?.id === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-white/3")}>
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                          {c.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-sm text-muted-foreground">{c.phone || c.email}</p>
                        </div>
                        {selectedClient?.id === c.id && <Check className="w-5 h-5 text-primary ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 2 — Select Service */}
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICES.map(s => (
                      <button key={s} onClick={() => setService(s)}
                        className={cn("p-4 rounded-2xl border-2 text-center transition-all",
                          selectedService === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40 text-foreground hover:bg-white/3")}>
                        <Briefcase className="w-6 h-6 mx-auto mb-2 opacity-70" />
                        <p className="text-sm font-semibold">{s}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 3 — Date & Time */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />{t("bookings.pickDate")}</label>
                      <input type="date" value={selectedDate} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base [color-scheme:dark] focus:outline-none focus:border-primary/60 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />{t("bookings.pickTime")}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {["09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00"].map(t => (
                          <button key={t} onClick={() => setTime(t)}
                            className={cn("py-3 rounded-xl border-2 text-sm font-medium transition-all",
                              selectedTime === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-foreground")}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">{t("bookings.notes")}</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("bookings.addNotes")} rows={3}
                        className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary/60 resize-none transition-colors placeholder:text-muted-foreground" />
                    </div>
                  </div>
                )}

                {/* Step 4 — Confirm */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-background border border-border rounded-2xl divide-y divide-border/40">
                      {[
                        { icon: User, label: t("bookings.client"), value: selectedClient?.name },
                        { icon: Briefcase, label: t("bookings.service"), value: selectedService },
                        { icon: Calendar, label: t("bookings.date"), value: selectedDate ? new Date(selectedDate).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" }) : "" },
                        { icon: Clock, label: t("bookings.time"), value: selectedTime },
                      ].map(({ icon: Icon, label, value }) => value && (
                        <div key={label} className="flex items-center gap-4 px-4 py-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
                          <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-semibold text-foreground">{value}</p></div>
                        </div>
                      ))}
                    </div>
                    {notes && <div className="bg-background border border-border rounded-2xl px-4 py-3 text-sm text-muted-foreground"><p className="font-semibold text-foreground mb-1">Notes</p>{notes}</div>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Nav */}
          <div className="px-6 py-4 border-t border-border bg-background/40 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 border border-border rounded-2xl text-muted-foreground hover:text-foreground font-semibold transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t("common.back")}
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-primary/90 transition-colors">
                {t("common.next")} <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-60 hover:bg-primary/90 transition-colors">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {t("bookings.wizard.save")}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
