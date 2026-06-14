import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, LayoutDashboard, Calendar, Users, FileText, Package,
  CheckSquare, Settings, Globe, Plus, Sparkles, ArrowRight, X, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAIQuery?: (q: string) => void;
}

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  category: string;
  icon: any;
  action: () => void;
};

const NAV_ITEMS = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { label: "Bookings",    href: "/bookings",    icon: Calendar        },
  { label: "Clients",     href: "/clients",     icon: Users           },
  { label: "Invoices",    href: "/invoices",    icon: FileText        },
  { label: "Inventory",   href: "/inventory",   icon: Package         },
  { label: "Tasks",       href: "/tasks",       icon: CheckSquare     },
  { label: "Public Page", href: "/public-page", icon: Globe           },
  { label: "Settings",    href: "/settings",    icon: Settings        },
];

const QUICK_ACTIONS = [
  { label: "+ New Booking",  href: "/bookings?new=1",  icon: Plus },
  { label: "+ New Client",   href: "/clients?new=1",   icon: Plus },
  { label: "+ New Invoice",  href: "/invoices?new=1",  icon: Plus },
  { label: "+ New Task",     href: "/tasks?new=1",     icon: Plus },
];

const RECENT_STORAGE_KEY = "nf_cmd_recent";

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function addRecent(label: string) {
  const prev = getRecent().filter(r => r !== label).slice(0, 4);
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify([label, ...prev]));
}

export function CommandPalette({ open, onClose, onAIQuery }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setActiveIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  // Fetch clients when query changes
  useEffect(() => {
    if (!query.trim()) { setClients([]); return; }
    const token = localStorage.getItem("nf_token");
    if (!token) return;
    const q = query.trim();
    fetch(`/api/clients?search=${encodeURIComponent(q)}&limit=5`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(d => setClients(d?.clients || [])).catch(() => {});
  }, [query]);

  const navigate = (href: string, label: string) => {
    addRecent(label);
    setLocation(href);
    onClose();
  };

  // Build results
  const results: ResultItem[] = [];

  if (!query.trim()) {
    // Show recent actions + nav
    const recents = getRecent();
    const allNav = NAV_ITEMS.map(n => ({ ...n, category: "Navigate" }));
    if (recents.length > 0) {
      recents.forEach(r => {
        const found = NAV_ITEMS.find(n => n.label === r) || QUICK_ACTIONS.find(n => n.label === r);
        if (found) results.push({ id: `recent-${found.href}`, label: found.label, category: "Recent", icon: Clock, action: () => navigate(found.href, found.label) });
      });
    }
    allNav.forEach(n => results.push({ id: n.href, label: `Go to ${n.label}`, category: "Navigate", icon: n.icon, action: () => navigate(n.href, n.label) }));
    QUICK_ACTIONS.forEach(a => results.push({ id: a.href, label: a.label, category: "Quick Add", icon: a.icon, action: () => navigate(a.href, a.label) }));
  } else {
    const q = query.toLowerCase();
    NAV_ITEMS.filter(n => n.label.toLowerCase().includes(q)).forEach(n =>
      results.push({ id: n.href, label: `Go to ${n.label}`, category: "Navigate", icon: n.icon, action: () => navigate(n.href, n.label) }));
    QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(q)).forEach(a =>
      results.push({ id: a.href, label: a.label, category: "Quick Add", icon: a.icon, action: () => navigate(a.href, a.label) }));
    clients.forEach(c => results.push({ id: `client-${c.id}`, label: c.name, sublabel: c.email || c.phone, category: "Clients", icon: Users, action: () => navigate(`/clients/${c.id}`, c.name) }));
    // AI query option
    results.push({ id: "ai-query", label: `Ask AI: "${query}"`, category: "AI Assistant", icon: Sparkles, action: () => { onAIQuery?.(query); onClose(); } });
  }

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")    { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); results[activeIdx]?.action(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, activeIdx, results, onClose, onAIQuery]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  // Group by category
  const grouped: Record<string, ResultItem[]> = {};
  results.forEach(r => { (grouped[r.category] ??= []).push(r); });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[101] w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search or type a command..."
                className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none" />
              {query && <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              <kbd className="hidden sm:inline text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-1">
              {results.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">No results found</div>
              )}
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{category}</div>
                  {items.map(item => {
                    const globalIdx = results.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button key={item.id} onClick={item.action} onMouseEnter={() => setActiveIdx(globalIdx)}
                        className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                          activeIdx === globalIdx ? "bg-primary/10 text-primary" : "text-foreground hover:bg-white/5")}>
                        <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <span>{item.label}</span>
                          {item.sublabel && <span className="ml-2 text-xs text-muted-foreground">{item.sublabel}</span>}
                        </div>
                        {activeIdx === globalIdx && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
              <span><kbd className="border border-border rounded px-1 py-0.5">↑↓</kbd> navigate</span>
              <span><kbd className="border border-border rounded px-1 py-0.5">↵</kbd> select</span>
              <span><kbd className="border border-border rounded px-1 py-0.5">esc</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
