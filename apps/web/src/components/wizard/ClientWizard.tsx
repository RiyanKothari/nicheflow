import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, User, Phone, FileText, Check, Loader2, PartyPopper } from "lucide-react";
import { useTranslation } from "react-i18next";
import { VoiceMic } from "@/components/global/VoiceMic";
import { cn } from "@/lib/utils";

interface ClientWizardProps {
  onClose: () => void;
  onCreated: (client: any) => void;
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

export function ClientWizard({ onClose, onCreated }: ClientWizardProps) {
  const { t } = useTranslation();
  const lang = localStorage.getItem("nf_lang") || "en";
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [createdClient, setCreated] = useState<any>(null);
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const canNext = [!!name.trim(), !!phone.trim(), true, true][step];

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/clients", { method: "POST", headers: authHeader(), body: JSON.stringify({ name: name.trim(), phone: phone.trim(), notes: notes.trim() }) });
    setSaving(false);
    if (res.ok) {
      const c = await res.json();
      setCreated(c);
      setStep(3);
      onCreated(c);
    }
  };

  const steps = [
    t("clients.wizard.step1Title"),
    t("clients.wizard.step2Title"),
    t("clients.wizard.step3Title"),
    t("clients.wizard.step4Title"),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={step < 3 ? onClose : undefined} />
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4">
        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-card border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden">

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

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

                {/* Step 1 — Name */}
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="relative">
                      <input autoFocus value={name} onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && name.trim() && setStep(1)}
                        placeholder={t("clients.wizard.namePlaceholder")}
                        className="w-full bg-background border-2 border-border rounded-2xl px-4 py-4 text-foreground text-lg font-medium focus:outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground pr-12"
                        aria-label="Client name" />
                      <VoiceMic onTranscript={t => setName(t)} language={lang} className="absolute right-3 top-3.5" size="md" />
                    </div>
                  </div>
                )}

                {/* Step 2 — Phone */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Phone className="w-8 h-8 text-primary" />
                    </div>
                    <div className="relative">
                      <input autoFocus value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                        onKeyDown={e => e.key === "Enter" && phone.trim() && setStep(2)}
                        placeholder={t("clients.wizard.phonePlaceholder")}
                        className="w-full bg-background border-2 border-border rounded-2xl px-4 py-4 text-foreground text-lg font-medium focus:outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground"
                        aria-label="Phone number" />
                    </div>
                    {/* Large keypad hint */}
                    <p className="text-xs text-muted-foreground text-center">Enter phone number with country code</p>
                  </div>
                )}

                {/* Step 3 — Notes */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div className="relative">
                      <textarea autoFocus value={notes} onChange={e => setNotes(e.target.value)} rows={5}
                        placeholder={t("clients.wizard.notesPlaceholder")}
                        className="w-full bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base focus:outline-none focus:border-primary/60 resize-none transition-colors placeholder:text-muted-foreground"
                        aria-label="Notes" />
                      <VoiceMic onTranscript={t => setNotes(n => n + " " + t)} language={lang} className="absolute right-3 top-3" size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{t("common.optional")} — allergies, preferences, contact preferences…</p>
                  </div>
                )}

                {/* Step 4 — Done */}
                {step === 3 && (
                  <div className="flex flex-col items-center text-center py-4 gap-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-teal-500/10 flex items-center justify-center">
                      <PartyPopper className="w-10 h-10 text-teal-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{t("clients.wizard.successMsg")}</h3>
                      <p className="text-muted-foreground mt-1">{createdClient?.name} has been added to your clients.</p>
                    </div>
                    <div className="bg-background border border-border rounded-2xl p-4 w-full text-left space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{createdClient?.name?.charAt(0)}</div>
                        <div>
                          <p className="font-semibold text-foreground">{createdClient?.name}</p>
                          <p className="text-sm text-muted-foreground">{phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-background/40 flex gap-3">
            {step < 3 && step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3 border border-border rounded-2xl text-muted-foreground hover:text-foreground font-semibold transition-colors">
                <ChevronLeft className="w-4 h-4" /> {t("common.back")}
              </button>
            )}
            {step === 0 && <div className="flex-1" />}
            {step < 2 && (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-40 hover:bg-primary/90 transition-colors">
                {t("common.next")} <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {step === 2 && (
              <button onClick={save} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base disabled:opacity-60 hover:bg-primary/90 transition-colors">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
                {t("clients.wizard.save")}
              </button>
            )}
            {step === 3 && (
              <button onClick={onClose}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 transition-colors">
                {t("common.done")}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
