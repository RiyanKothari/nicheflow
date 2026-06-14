import { useState, useRef, useEffect } from "react";
import { Bell, Calendar, AlertCircle, Package, CheckSquare, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/context/NotificationsContext";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: any; color: string }> = {
  booking: { icon: Calendar,     color: "text-blue-400 bg-blue-500/10"   },
  invoice: { icon: AlertCircle,  color: "text-red-400 bg-red-500/10"     },
  stock:   { icon: Package,      color: "text-amber-400 bg-amber-500/10" },
  task:    { icon: CheckSquare,  color: "text-teal-400 bg-teal-500/10"   },
  review:  { icon: Star,         color: "text-yellow-400 bg-yellow-500/10"},
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground">
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">All caught up! No notifications.</div>
              ) : (
                notifications.map(n => {
                  const meta = TYPE_META[n.type] || TYPE_META.booking;
                  const Icon = meta.icon;
                  return (
                    <button key={n.id} onClick={() => markRead(n.id)}
                      className={cn("w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/40 last:border-0 transition-colors hover:bg-white/5", !n.read && "bg-primary/3")}>
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", meta.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
