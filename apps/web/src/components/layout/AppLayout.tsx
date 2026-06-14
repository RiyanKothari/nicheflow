import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, FileText, Package, CheckSquare,
  Settings, LogOut, Menu, X, Sparkles, Globe, Search,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSimpleMode } from "@/context/SimpleModeContext";
import { useDateFilter, DateFilterType } from "@/context/DateFilterContext";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/global/NotificationsBell";
import { CommandPalette } from "@/components/global/CommandPalette";
import { FloatingAI } from "@/components/global/FloatingAI";
import { MobileBottomNav } from "@/components/global/MobileBottomNav";

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/bookings",    label: "Bookings",    icon: Calendar        },
  { href: "/clients",     label: "Clients",     icon: Users           },
  { href: "/invoices",    label: "Invoices",    icon: FileText        },
  { href: "/inventory",   label: "Inventory",   icon: Package         },
  { href: "/tasks",       label: "Tasks",       icon: CheckSquare     },
  { href: "/public-page", label: "Public Page", icon: Globe           },
];

const DATE_FILTERS: { value: DateFilterType; label: string }[] = [
  { value: "today", label: "Today"      },
  { value: "week",  label: "This Week"  },
  { value: "month", label: "This Month" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { simpleMode, toggleSimpleMode } = useSimpleMode();
  const { filter, setFilter } = useDateFilter();

  const [isMobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen]         = useState(false);
  const [aiQuery, setAIQuery]         = useState<string | undefined>(undefined);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAIQuery = (q: string) => setAIQuery(q);
  const clearAIQuery  = () => setAIQuery(undefined);

  const pageTitle = (() => {
    if (location === "/dashboard")   return "Dashboard";
    if (location === "/bookings")    return "Bookings";
    if (location === "/clients")     return "Clients";
    if (location === "/invoices")    return "Invoices";
    if (location === "/inventory")   return "Inventory";
    if (location === "/tasks")       return "Tasks";
    if (location === "/public-page") return "Public Page";
    if (location === "/settings")    return "Settings";
    if (location.startsWith("/clients/")) return "Client Profile";
    if (location.startsWith("/invoices/")) return "Invoice";
    return location.replace("/", "") || "Dashboard";
  })();

  const navItems = simpleMode ? NAV_ITEMS.slice(0, 4) : NAV_ITEMS;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shrink-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <span className="font-display font-bold text-xl text-foreground">NicheFlow</span>
          </Link>
          <button className="md:hidden text-muted-foreground" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map(item => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  simpleMode && "text-base")}>
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="p-4 border-t border-border flex flex-col gap-2">
          <Link href="/settings"
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
              location === "/settings" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground")}>
            <Settings className="h-5 w-5" />
            Settings
          </Link>
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left min-h-[44px]">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h2 className={cn("font-semibold capitalize font-display hidden sm:block truncate", simpleMode ? "text-xl" : "text-lg")}>
              {pageTitle}
            </h2>
          </div>

          {/* Centre: Date Filter */}
          <div className="hidden md:flex items-center gap-1 bg-muted/30 rounded-xl p-1">
            {DATE_FILTERS.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)}
                className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                  filter === f.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search/Command */}
            <button onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors text-xs hidden sm:flex min-h-[36px]">
              <Search className="w-3.5 h-3.5" />
              <span className="hidden lg:block">Search</span>
              <kbd className="hidden lg:inline text-[10px] border border-border/60 rounded px-1">⌘K</kbd>
            </button>
            <button onClick={() => setCmdOpen(true)} className="sm:hidden p-2 text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
            </button>

            {/* Simple Mode toggle */}
            <button onClick={toggleSimpleMode} title={simpleMode ? "Disable Simple Mode" : "Enable Simple Mode"}
              className={cn("w-9 h-9 flex items-center justify-center rounded-xl border transition-colors",
                simpleMode ? "bg-primary/10 border-primary text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-white/5")}>
              <Zap className="w-4 h-4" />
            </button>

            {/* Notifications */}
            <NotificationsBell />

            {/* User Avatar */}
            <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border min-h-[36px]">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className={cn("flex-1 overflow-auto p-4 sm:p-6 lg:p-8", "pb-20 md:pb-8")}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            className="h-full w-full max-w-7xl mx-auto">
            {children}
          </motion.div>
        </div>
      </main>

      {/* Global Overlays */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onAIQuery={handleAIQuery} />
      <FloatingAI initialQuery={aiQuery} onQueryConsumed={clearAIQuery} />
      <MobileBottomNav />
    </div>
  );
}
