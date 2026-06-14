import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Mic, AlertCircle, ArrowRight, Loader2,
  Users, Calendar, FileText, Package, CheckSquare, Globe,
  CheckCircle2,
} from "lucide-react";

const FULL_GREETING = "Hi! I'm your NicheFlow AI. Tell me about your business and I'll build your complete workspace.";

const EXAMPLE_CHIPS = [
  "I run a small barbershop in Mumbai 💈",
  "I'm a home baker in Bangalore 🎂",
  "I teach Bharatanatyam dance in Hyderabad 💃",
  "I'm a mobile car mechanic in Delhi 🔧",
  "I'm a dog trainer in Chennai 🐕",
  "I run a wedding planning business 💍",
  "I'm a yoga instructor 🧘",
  "I'm a private tutor 📚",
];

const MODULES = [
  { key: "clients",    label: "Clients",     Icon: Users },
  { key: "bookings",  label: "Bookings",    Icon: Calendar },
  { key: "invoices",  label: "Invoices",    Icon: FileText },
  { key: "inventory", label: "Inventory",   Icon: Package },
  { key: "tasks",     label: "Tasks",       Icon: CheckSquare },
  { key: "publicPage",label: "Public Page", Icon: Globe },
];

const BUILD_STEPS = [
  { label: "Setting up your workspace...",      progress: 20, module: "clients",    delay: 700 },
  { label: "Configuring your modules...",        progress: 40, module: "bookings",   delay: 650 },
  { label: "Configuring your modules...",        progress: 55, module: "invoices",   delay: 550 },
  { label: "Personalizing for your niche...",    progress: 70, module: "inventory",  delay: 550 },
  { label: "Preparing your sample data...",      progress: 82, module: "tasks",      delay: 500 },
  { label: "Almost ready...",                    progress: 90, module: "publicPage", delay: 400 },
];

const COLOR_MAP: Record<string, string> = {
  purple: "bg-violet-500",
  teal:   "bg-teal-500",
  coral:  "bg-rose-400",
  amber:  "bg-amber-400",
};

export function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"chat" | "building" | "preview">("chat");

  // Step 1 state
  const [greeting, setGreeting]       = useState("");
  const [greetingDone, setGreetingDone] = useState(false);
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [fieldError, setFieldError]   = useState("");

  // Step 2 state
  const [buildProgress, setBuildProgress]     = useState(0);
  const [buildLabel, setBuildLabel]           = useState("Setting up your workspace...");
  const [completedModules, setCompletedModules] = useState<string[]>([]);

  // Step 3 state
  const [workspaceConfig, setWorkspaceConfig] = useState<any>(null);
  const [isCompleting, setIsCompleting]       = useState(false);

  // Check if already onboarded
  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    if (!token) { setLocation("/login"); return; }
    fetch("/api/onboarding/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.completed) setLocation("/dashboard"); })
      .catch(() => {});
  }, []);

  // Typewriter
  useEffect(() => {
    if (step !== "chat") return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setGreeting(FULL_GREETING.slice(0, i));
      if (i >= FULL_GREETING.length) { clearInterval(id); setGreetingDone(true); }
    }, 28);
    return () => clearInterval(id);
  }, [step]);

  async function runBuildAnimation(apiPromise: Promise<any>) {
    let resolved = false;
    let configResult: any = null;

    apiPromise.then(c => { configResult = c; resolved = true; }).catch(() => { resolved = true; });

    for (const s of BUILD_STEPS) {
      await new Promise(r => setTimeout(r, s.delay));
      setBuildProgress(s.progress);
      setBuildLabel(s.label);
      setCompletedModules(prev => [...prev, s.module]);
    }

    // Wait for API to finish (minimum ~3.4 s covered by delays above)
    while (!resolved) await new Promise(r => setTimeout(r, 200));

    setWorkspaceConfig(configResult);
    await new Promise(r => setTimeout(r, 400));
    setBuildProgress(100);
    await new Promise(r => setTimeout(r, 600));
    setStep("preview");
  }

  function handleSubmit() {
    if (description.trim().length < 20) {
      setFieldError("Please describe your business in a bit more detail.");
      return;
    }
    setFieldError("");
    setStep("building");

    const token = localStorage.getItem("nf_token");
    const apiPromise = fetch("/api/onboarding/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description }),
    })
      .then(r => r.json())
      .then(d => d.raw || d.config);

    runBuildAnimation(apiPromise);
  }

  function handleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in your browser. Try Chrome."); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      setDescription(prev => prev + e.results[0][0].transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend   = () => setIsListening(false);
    rec.start();
    setIsListening(true);
  }

  async function handleComplete() {
    setIsCompleting(true);
    const token = localStorage.getItem("nf_token");
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
    } catch {}
    setLocation("/dashboard");
  }

  /* ─── STEP 1: CHAT ─── */
  if (step === "chat") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[680px]">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-10">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold text-foreground">NicheFlow</span>
          </div>

          {/* Typewriter greeting */}
          <h1 className="text-center text-2xl sm:text-3xl font-bold text-foreground mb-2 max-w-xl mx-auto leading-snug min-h-[4rem]">
            {greeting}
            {!greetingDone && <span className="animate-pulse">|</span>}
          </h1>
          <p className="text-center text-sm text-muted-foreground mb-10">
            No forms. No setup. Just describe what you do.
          </p>

          {/* Textarea + mic */}
          <div className="relative">
            <textarea
              className="w-full min-h-[160px] bg-card border border-border rounded-2xl p-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="e.g. I run a small dog training business in Chennai. I handle one-on-one sessions and group classes, manage around 15 clients, and charge per session..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <button
              onClick={handleVoice}
              className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all ${
                isListening
                  ? "bg-primary/20 border border-primary text-primary animate-pulse"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          {fieldError && (
            <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />{fieldError}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="mt-6 w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold text-sm hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-2 transition-all"
          >
            Build my workspace <ArrowRight className="w-4 h-4" />
          </button>

          {/* Example chips */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground mb-3">Try an example:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => setDescription(chip)}
                  className="text-xs px-3.5 py-2 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-primary/5 transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── STEP 2: BUILDING ─── */
  if (step === "building") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full">
          {/* Animated icon */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="mx-auto mb-6 w-12 h-12 text-primary flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10" />
          </motion.div>

          <h2 className="text-xl font-bold text-foreground text-center mb-1">{buildLabel}</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Building your workspace…</p>

          {/* Module grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {MODULES.map(({ key, label, Icon }) => {
              const done = completedModules.includes(key);
              return (
                <div
                  key={key}
                  className={`relative rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all duration-500 ${
                    done ? "border-primary/40 bg-primary/10 opacity-100" : "border-border bg-card opacity-40"
                  }`}
                >
                  {done && (
                    <CheckCircle2 className="absolute top-1.5 right-1.5 w-3 h-3 text-primary" />
                  )}
                  <Icon className={`w-5 h-5 ${done ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${done ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${buildProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-right">{buildProgress}%</p>
        </div>
      </div>
    );
  }

  /* ─── STEP 3: PREVIEW ─── */
  const terminology = workspaceConfig?.terminology || {};
  const modules: string[] = workspaceConfig?.modules || [];
  const colorClass = COLOR_MAP[workspaceConfig?.color] || "bg-violet-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12"
    >
      <div className="w-full max-w-[580px]">
        {/* Celebration */}
        <div className="flex justify-center gap-2 text-2xl mb-4">
          {["🎉", "✨", "🚀"].map((emoji, i) => (
            <motion.span
              key={emoji}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-2">
          Your workspace is ready!
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">Built specifically for your niche</p>

        {/* Config card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          {/* Niche + color */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-3 py-1.5 rounded-full border border-primary/20">
                <span className="text-base">{workspaceConfig?.nicheEmoji || "🏪"}</span>
                {workspaceConfig?.niche || "Your Business"}
              </span>
              <p className="text-lg font-semibold text-foreground mt-2">
                {workspaceConfig?.businessName || "My Business"}
              </p>
              {workspaceConfig?.dashboardMetric && (
                <p className="text-xs text-muted-foreground mt-1">📊 Key metric: <span className="font-medium text-foreground">{workspaceConfig.dashboardMetric}</span></p>
              )}
            </div>
            <div className={`w-10 h-10 rounded-full border-2 border-border ${colorClass}`} />
          </div>

          <div className="border-t border-border mb-5" />

          {/* Terminology */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Your workspace language
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Clients called",   value: terminology.clients   || "Clients" },
              { label: "Bookings called",  value: terminology.bookings  || "Bookings" },
              { label: "Inventory called", value: terminology.inventory || "Inventory" },
              { label: "Tasks called",     value: terminology.tasks     || "Tasks" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-background rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Services */}
          {workspaceConfig?.services?.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Your services
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {workspaceConfig.services.slice(0, 6).map((s: string) => (
                  <span key={s} className="text-xs bg-background border border-border px-2.5 py-1 rounded-full text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Kanban columns */}
          {workspaceConfig?.kanbanColumns?.length === 4 && (
            <>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Workflow stages
              </p>
              <div className="grid grid-cols-4 gap-2 mb-5">
                {workspaceConfig.kanbanColumns.map((col: string, i: number) => (
                  <div key={col} className="bg-background rounded-xl p-2 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{i + 1}</p>
                    <p className="text-xs font-semibold text-foreground leading-tight">{col}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Modules */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Enabled modules
          </p>
          <div className="flex flex-wrap gap-2">
            {(modules.length ? modules : ["bookings","clients","invoices","tasks"]).map(m => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20"
              >
                <CheckCircle2 className="w-3 h-3" />
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </span>
            ))}
          </div>

          {/* Tagline */}
          {workspaceConfig?.suggestedTagline && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground italic text-center">
                "{workspaceConfig.suggestedTagline}"
              </p>
            </div>
          )}
        </div>

        {/* Enter workspace button */}
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-semibold text-base hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {isCompleting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
            : <>Enter my workspace <ArrowRight className="w-4 h-4" /></>
          }
        </button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          You can customize everything from Settings later.
        </p>
      </div>
    </motion.div>
  );
}
