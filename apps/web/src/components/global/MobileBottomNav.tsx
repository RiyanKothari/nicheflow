import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Calendar, Users, FileText, MoreHorizontal, Plus, Package, CheckSquare, Globe, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const PRIMARY_NAV = [
  { href: "/dashboard", label: "Home",     icon: LayoutDashboard },
  { href: "/bookings",  label: "Bookings", icon: Calendar        },
  { href: "/clients",   label: "Clients",  icon: Users           },
  { href: "/invoices",  label: "Invoices", icon: FileText        },
];

const MORE_ITEMS = [
  { href: "/inventory",   label: "Inventory",    icon: Package    },
  { href: "/tasks",       label: "Tasks",        icon: CheckSquare},
  { href: "/public-page", label: "Public Page",  icon: Globe      },
  { href: "/settings",    label: "Settings",     icon: Settings   },
];

const QUICK_ADD = [
  { href: "/bookings?new=1",  label: "New Booking", color: "bg-blue-500"  },
  { href: "/clients?new=1",   label: "New Client",  color: "bg-teal-500"  },
  { href: "/invoices?new=1",  label: "New Invoice", color: "bg-purple-500"},
  { href: "/tasks?new=1",     label: "New Task",    color: "bg-amber-500" },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const [showMore, setShowMore]         = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { logout } = useAuth();

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  return (
    <>
      {/* More Drawer */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 md:hidden" onClick={() => setShowMore(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
              className="fixed bottom-16 left-0 right-0 z-[71] bg-card border-t border-border rounded-t-2xl p-4 md:hidden">
              <div className="grid grid-cols-4 gap-3">
                {MORE_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}
                      className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors",
                        isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                      <Icon className="w-5 h-5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-border pt-3">
                <button onClick={() => { setShowMore(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Add Menu */}
      <AnimatePresence>
        {showQuickAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/60 md:hidden" onClick={() => setShowQuickAdd(false)} />
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[71] flex flex-col gap-2 items-center md:hidden">
              {QUICK_ADD.map((item, i) => (
                <motion.div key={item.href}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ delay: i * 0.04, type: "spring", damping: 25, stiffness: 350 }}>
                  <Link href={item.href} onClick={() => setShowQuickAdd(false)}
                    className={cn("flex items-center gap-3 px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg", item.color)}>
                    <Plus className="w-4 h-4" /> {item.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button onClick={() => { setShowQuickAdd(o => !o); setShowMore(false); }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[72] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center md:hidden transition-transform hover:scale-105">
        <motion.span animate={{ rotate: showQuickAdd ? 45 : 0 }} transition={{ type: "spring", damping: 20 }}>
          <Plus className="w-5 h-5" />
        </motion.span>
      </button>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[60] h-16 bg-card border-t border-border flex items-center px-2 md:hidden">
        {PRIMARY_NAV.map(item => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => { setShowMore(false); setShowQuickAdd(false); }}
              className="flex-1 flex flex-col items-center gap-1 py-2">
              <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />}
            </Link>
          );
        })}
        {/* More */}
        <button onClick={() => { setShowMore(o => !o); setShowQuickAdd(false); }}
          className={cn("flex-1 flex flex-col items-center gap-1 py-2", showMore ? "text-primary" : "text-muted-foreground")}>
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}
