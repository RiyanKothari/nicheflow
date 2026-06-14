import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Minimize2, Send, Trash2, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { VoiceMic } from "./VoiceMic";
import { cn } from "@/lib/utils";

interface Message { role: "user" | "assistant"; content: string; action?: { type: string; data?: any } | null; }

// Niche-specific suggested prompts
const NICHE_PROMPTS: Record<string, string[]> = {
  dog_trainer:     ["Who has an upcoming session?", "Which clients haven't booked in a while?", "How many sessions this week?", "Draft a reminder for a client"],
  beauty_salon:    ["Who has appointments today?", "Which products are low on stock?", "Show unpaid invoices", "Draft a Diwali offer message"],
  tailor:          ["What orders are pending delivery?", "Who hasn't paid?", "What fabrics are running low?", "How many orders this month?"],
  photographer:    ["Who has a shoot this week?", "Show pending payments", "Draft a delivery message to a client", "How's revenue this month?"],
  chef:            ["What events are coming up?", "Which ingredients are low?", "Show unpaid invoices", "Draft a menu confirmation message"],
  fitness_trainer: ["Who has sessions today?", "Which clients are at risk of dropping off?", "Show unpaid invoices", "How many sessions this week?"],
  tutor:           ["Who has classes today?", "Which students haven't paid?", "How many sessions this month?", "Draft a parent progress update"],
  home_repair:     ["What jobs are scheduled?", "Who owes payment?", "Which materials are low?", "Draft a job completion message"],
  urban_farmer:    ["What items are low on stock?", "Who are my regular buyers?", "Show this month's revenue", "Draft a harvest availability message"],
  wedding_planner: ["What events are coming up?", "Which clients have pending payments?", "What tasks are overdue?", "Draft a vendor confirmation message"],
  default:         ["What's due today?", "Show unpaid invoices", "How's my business doing?", "Which items are low on stock?"],
};

function getNicheKey(niche: string): string {
  if (!niche) return "default";
  const k = niche.toLowerCase().replace(/\s+/g, "_");
  return NICHE_PROMPTS[k] ? k : (Object.keys(NICHE_PROMPTS).find(key => k.includes(key) || key.includes(k)) || "default");
}

const NICHE_EMOJIS: Record<string, string> = {
  dog_trainer: "🐕", beauty_salon: "💅", tailor: "🧵", photographer: "📸",
  chef: "👨‍🍳", fitness_trainer: "💪", tutor: "📚", home_repair: "🔧",
  urban_farmer: "🌱", wedding_planner: "💒", default: "✨",
};

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}

// Simple markdown renderer: bold, bullet lists, line breaks
function RenderMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bullet point
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
          const text = line.replace(/^[-•]\s*/, "");
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-primary mt-0.5 shrink-0">•</span>
              <span>{renderInline(text)}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line.trim())) {
          const text = line.replace(/^\d+\.\s*/, "");
          const num = line.match(/^(\d+)/)?.[1];
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-primary shrink-0 font-medium">{num}.</span>
              <span>{renderInline(text)}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function FloatingAI({ initialQuery, onQueryConsumed }: { initialQuery?: string; onQueryConsumed?: () => void }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [workspace, setWorkspace] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lang = localStorage.getItem("nf_lang") || "en";

  // ── Draggable FAB position ─────────────────────────────────────────────────
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(() => {
    try { return JSON.parse(localStorage.getItem("nf_ai_pos") || "null"); } catch { return null; }
  });
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStart = useRef({ cx: 0, cy: 0, px: 0, py: 0 });

  const onFabPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    hasMoved.current = false;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    dragStart.current = { cx: e.clientX, cy: e.clientY, px: rect.left, py: rect.top };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const onFabPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.cx;
    const dy = e.clientY - dragStart.current.cy;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
    if (!hasMoved.current) return;
    const x = Math.max(8, Math.min(window.innerWidth - 64, dragStart.current.px + dx));
    const y = Math.max(8, Math.min(window.innerHeight - 64, dragStart.current.py + dy));
    setFabPos({ x, y });
  };
  const onFabPointerUp = () => {
    isDragging.current = false;
    if (!hasMoved.current) {
      setOpen(true);
      setMinimized(false);
    } else if (fabPos) {
      localStorage.setItem("nf_ai_pos", JSON.stringify(fabPos));
    }
  };

  // Fetch workspace config for niche context
  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    if (!token) return;
    fetch("/api/onboarding/config", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setWorkspace(d))
      .catch(() => {});
  }, []);

  const niche = workspace?.niche || "";
  const nicheKey = getNicheKey(niche);
  const nicheEmoji = NICHE_EMOJIS[nicheKey] || "✨";
  const terminology = workspace?.terminology || {};
  const businessName = workspace?.businessName || "";
  const suggestedPrompts = NICHE_PROMPTS[nicheKey] || NICHE_PROMPTS.default;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (initialQuery && !open) {
      setOpen(true);
      setMinimized(false);
      setTimeout(() => { setInput(initialQuery); onQueryConsumed?.(); }, 200);
    }
  }, [initialQuery]);

  const send = async (msg?: string) => {
    const text = (msg ?? input).trim();
    if (!text || loading) return;
    const newMsg: Message = { role: "user", content: text };
    const history = [...messages, newMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ message: text, conversationHistory: messages, language: lang, workspaceId: workspace?.id }),
      });
      const data = await res.json();
      setMessages([...history, {
        role: "assistant",
        content: data.reply || "I'm not sure how to help with that.",
        action: data.action || null,
      }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "Sorry, I couldn't connect right now. Please try again." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const fabStyle: React.CSSProperties = fabPos
    ? { position: "fixed", left: fabPos.x, top: fabPos.y, bottom: "auto", right: "auto" }
    : { position: "fixed", bottom: "76px", right: "24px" };

  return (
    <>
      {/* Floating Button — draggable */}
      <AnimatePresence>
        {(!open || minimized) && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{ ...fabStyle, zIndex: 90 }}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={onFabPointerDown}
            onPointerMove={onFabPointerMove}
            onPointerUp={onFabPointerUp}
            title="Tap to open · drag to move"
          >
            <Sparkles className="w-6 h-6 pointer-events-none" />
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full text-[9px] font-bold text-black flex items-center justify-center pointer-events-none">
                {messages.filter(m => m.role === "assistant").length}
              </span>
            )}
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span className="w-1 h-1 rounded-full bg-white/30" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel — full-width on mobile, 390px on desktop */}
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed z-[90] bg-card border border-border shadow-2xl flex flex-col overflow-hidden
              inset-x-2 bottom-2 rounded-2xl
              sm:inset-x-auto sm:bottom-[76px] sm:right-6 sm:w-[390px] sm:h-[560px]"
            style={{ height: "min(560px, calc(100dvh - 12px))" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-lg">
                {nicheEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {businessName ? `${businessName} AI` : "NicheFlow AI"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {niche ? `${niche} assistant` : "Your business assistant"} · always online
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMessages([])} title="Clear chat"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setMinimized(true)} title="Minimize"
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center gap-4 pb-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    {nicheEmoji}
                  </div>
                  <div className="text-center px-2">
                    <p className="text-sm font-semibold text-foreground">
                      Hi! I know your {niche || "business"} inside out.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Ask me about your {terminology.clients || "clients"}, {terminology.bookings || "bookings"},
                      invoices, or get {niche ? `${niche}-specific` : "business"} advice.
                    </p>
                  </div>

                  {/* Quick action categories */}
                  <div className="w-full space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide text-center">Try asking:</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {suggestedPrompts.map(p => (
                        <button
                          key={p}
                          onClick={() => send(p)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background/50 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick shortcuts */}
                  <div className="w-full border-t border-border pt-3 mt-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 text-center">Quick queries</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { icon: "📋", label: "Today's schedule", query: `What are my ${terminology.bookings || "bookings"} today?` },
                        { icon: "💰", label: "Unpaid invoices", query: "Who hasn't paid me? List all unpaid invoices." },
                        { icon: "📈", label: "Business advice", query: `Give me one actionable tip to grow my ${niche || "business"} this week.` },
                        { icon: "✍️", label: "Draft message", query: `Help me write a WhatsApp message to a ${terminology.clients || "client"}.` },
                      ].map(({ icon, label, query }) => (
                        <button
                          key={label}
                          onClick={() => send(query)}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-border bg-background/30 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                          <span className="text-base">{icon}</span>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-sm">
                      {nicheEmoji}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5 max-w-[78%]">
                    <div className={cn(
                      "px-3 py-2.5 rounded-2xl text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/60 text-foreground rounded-tl-sm border border-border/50"
                    )}>
                      {m.role === "assistant" ? <RenderMessage content={m.content} /> : m.content}
                    </div>

                    {/* Action chips — shown below assistant messages */}
                    {m.role === "assistant" && m.action?.type === "create_task" && (
                      <Link href="/tasks" onClick={() => setOpen(false)}>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-400 hover:bg-teal-500/20 transition-colors cursor-pointer">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Task created: "{m.action.data?.title}"</span>
                          <ArrowRight className="w-3 h-3 ml-auto shrink-0" />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">{nicheEmoji}</div>
                  <div className="bg-muted/60 border border-border/50 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-border bg-background/40 shrink-0">
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
                <VoiceMic
                  onTranscript={t => setInput(prev => prev + (prev ? " " : "") + t)}
                  language={lang}
                  size="sm"
                />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask about your ${niche || "business"}...`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                Powered by NicheFlow AI · knows your live data
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
