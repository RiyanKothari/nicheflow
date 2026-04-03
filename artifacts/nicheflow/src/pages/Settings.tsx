import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Briefcase, Bell, Globe, Users, CreditCard, Link2, Shield, Sparkles,
  Save, Loader2, Check, Trash2, Plus, ChevronRight, AlertTriangle, Download,
  ExternalLink, RefreshCw, Zap, X, Clock, ToggleLeft, ToggleRight,
  Instagram, Phone, Mail,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; kind?: "ok" | "err" } | null>(null);
  const show = (msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2800);
  };
  return { toast, show };
}

function Toast({ toast }: { toast: { msg: string; kind?: "ok" | "err" } | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold",
            toast.kind === "err" ? "bg-red-500/90 text-white" : "bg-teal-500/90 text-white")}>
          {toast.kind === "err" ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={cn("w-10 h-5 rounded-full transition-all relative shrink-0", value ? "bg-primary" : "bg-muted/40")}>
      <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm", value ? "left-5" : "left-0.5")} />
    </button>
  );
}

// ── Card Section ───────────────────────────────────────────────────────────────

function Card({ id, icon: Icon, title, children, extra }: { id: string; icon: any; title: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div id={id} className="bg-card border border-border rounded-2xl overflow-hidden scroll-mt-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {extra}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none appearance-none cursor-pointer">
      {children}
    </select>
  );
}

// ── Sub Nav ────────────────────────────────────────────────────────────────────

const SUB_NAV = [
  { id: "profile",      icon: User,       key: "profile"      },
  { id: "workspace",    icon: Briefcase,  key: "workspace"    },
  { id: "customFields", icon: Sparkles,   key: "customFields" },
  { id: "notifications",icon: Bell,       key: "notifications"},
  { id: "language",     icon: Globe,      key: "language"     },
  { id: "team",         icon: Users,      key: "team"         },
  { id: "billing",      icon: CreditCard, key: "billing"      },
  { id: "integrations", icon: Link2,      key: "integrations" },
  { id: "dataPrivacy",  icon: Shield,     key: "dataPrivacy"  },
  { id: "aiPreferences",icon: Sparkles,   key: "aiPreferences"},
];

const LANGUAGES = [
  { code: "en", label: "English",   native: "English", flag: "🇬🇧", available: true  },
  { code: "hi", label: "Hindi",     native: "हिंदी",   flag: "🇮🇳", available: true  },
  { code: "ta", label: "Tamil",     native: "தமிழ்",   flag: "🇮🇳", available: false },
  { code: "te", label: "Telugu",    native: "తెలుగు",  flag: "🇮🇳", available: false },
  { code: "kn", label: "Kannada",   native: "ಕನ್ನಡ",   flag: "🇮🇳", available: false },
  { code: "mr", label: "Marathi",   native: "मराठी",   flag: "🇮🇳", available: false },
  { code: "bn", label: "Bengali",   native: "বাংলা",   flag: "🇮🇳", available: false },
  { code: "gu", label: "Gujarati",  native: "ગુજરાતી", flag: "🇮🇳", available: false },
];

const DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
const DAY_LABELS: Record<string, string> = { monday:"Mon",tuesday:"Tue",wednesday:"Wed",thursday:"Thu",friday:"Fri",saturday:"Sat",sunday:"Sun" };

const DEFAULT_TERMINOLOGY = { clients: "Clients", bookings: "Bookings", inventory: "Inventory", tasks: "Tasks", services: "Services" };

const MODULES = [
  { id: "dashboard",   label: "Dashboard"   },
  { id: "bookings",    label: "Bookings"    },
  { id: "clients",     label: "Clients"     },
  { id: "invoices",    label: "Invoices"    },
  { id: "inventory",   label: "Inventory"   },
  { id: "tasks",       label: "Tasks"       },
  { id: "publicPage",  label: "Public Page" },
];

const DASHBOARD_WIDGETS = [
  { id: "revenueChart",     label: "Revenue Chart"      },
  { id: "upcomingBookings", label: "Upcoming Bookings"  },
  { id: "quickActions",     label: "Quick Actions"      },
  { id: "aiInsights",       label: "AI Insights"        },
  { id: "recentClients",    label: "Recent Clients"     },
  { id: "stockAlerts",      label: "Stock Alerts"       },
];

const INTEGRATIONS_LIST = [
  { id: "whatsapp",       label: "WhatsApp Business", icon: "💬", desc: "Connect for booking notifications and client messages", hasKey: false },
  { id: "googleCalendar", label: "Google Calendar",    icon: "📅", desc: "Sync bookings with your Google Calendar",             hasKey: false },
  { id: "razorpay",       label: "Razorpay",           icon: "💳", desc: "Accept online payments from clients",                 hasKey: true  },
  { id: "instagram",      label: "Instagram",          icon: "📸", desc: "Share updates and sync profile",                     hasKey: false },
];

const FREE_FEATURES = ["Up to 50 clients", "Up to 100 bookings/month", "Basic invoicing", "Public page (with branding)", "1 user"];
const PREMIUM_FEATURES = ["Unlimited clients & bookings", "Custom invoice branding", "AI assistant (full access)", "Remove NicheFlow watermark", "Up to 5 team members", "Export all data", "Priority support"];

// ── Role Permissions ──────────────────────────────────────────────────────────

const ROLE_PERMISSIONS = [
  { role: "Staff",   color: "bg-blue-500/10 text-blue-400",   perms: "Can view and create bookings and clients. Cannot view invoices or settings." },
  { role: "Manager", color: "bg-purple-500/10 text-purple-400", perms: "Can do everything except billing and deleting data." },
  { role: "Owner",   color: "bg-amber-500/10 text-amber-400",  perms: "Full access to everything." },
];

// ── Main Settings Component ────────────────────────────────────────────────────

export function Settings() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast, show } = useToast();

  const [loading, setLoading]     = useState(true);
  const [activeSection, setActive] = useState("profile");

  // Data state
  const [user, setUser]           = useState<any>({});
  const [biz, setBiz]             = useState<any>({});
  const [ws, setWS]               = useState<any>({});
  const [settings, setSettings]   = useState<any>({});

  // Profile form
  const [profile, setProfile]     = useState<any>({});
  const [profileSaving, setPS]    = useState(false);

  // Workspace form
  const [terminology, setTerms]   = useState<any>(DEFAULT_TERMINOLOGY);
  const [modules, setModules]     = useState<string[]>([]);
  const [dashWidgets, setWidgets] = useState<any>({});
  const [simpleMode, setSM]       = useState(false);
  const [wsSaving, setWSSaving]   = useState(false);

  // Team
  const [teamEmail, setTE]        = useState("");
  const [teamRole, setTR]         = useState("staff");
  const [teamName, setTN]         = useState("");
  const [inviting, setInviting]   = useState(false);

  // Delete account modal
  const [showDelete, setSDel]     = useState(false);
  const [deleteConf, setDelConf]  = useState("");
  const [deleting, setDeleting]   = useState(false);

  // Custom Fields
  type CFDef = { id: string; label: string; type: string; placeholder?: string; required?: boolean; options?: string[] };
  const [ccf, setCCF] = useState<CFDef[]>([]);
  const [cbf, setCBF] = useState<CFDef[]>([]);
  const [cifFields, setCIF] = useState<CFDef[]>([]);
  const [cfTab, setCFTab] = useState<"clients"|"bookings"|"inventory">("clients");
  const [cfSaving, setCFSaving] = useState(false);

  // Integrations - razorpay keys
  const [rzpKey, setRZK]          = useState("");
  const [rzpSecret, setRZS]       = useState("");

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Fetch all settings ──

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/settings", { headers: authHeader() });
    if (!res.ok) { setLoading(false); return; }
    const d = await res.json();
    setUser(d.user || {}); setBiz(d.business || {}); setWS(d.workspace || {}); setSettings(d.settings || {});
    setProfile({ name: d.user?.name || "", businessName: d.business?.name || "", email: d.user?.email || "", phone: d.business?.phone || "", address: d.business?.address || "", city: d.business?.city || "", currency: d.business?.currency || "INR", description: d.business?.description || "" });
    setTerms({ ...DEFAULT_TERMINOLOGY, ...(d.workspace?.terminology || {}) });
    setModules((d.workspace?.modules as string[]) || MODULES.map(m => m.id));
    setWidgets(d.settings?.dashboardWidgets || {});
    setSM(d.settings?.simpleMode || false);
    setCCF(d.workspace?.customClientFields || []);
    setCBF(d.workspace?.customBookingFields || []);
    setCIF(d.workspace?.customInventoryFields || []);
    setRZK(d.settings?.integrations?.razorpay?.keyId || "");
    setRZS(d.settings?.integrations?.razorpay?.keySecret || "");
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Scroll spy ──

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.3, rootMargin: "-60px 0px -60% 0px" });
    SUB_NAV.forEach(s => { const el = sectionRefs.current[s.id]; if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [loading]);

  const scrollTo = (id: string) => {
    setActive(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Saves ──

  const saveProfile = async () => {
    setPS(true);
    const res = await fetch("/api/settings/profile", { method: "PUT", headers: authHeader(), body: JSON.stringify({ ...profile, operatingHours: settings.operatingHours }) });
    setPS(false);
    if (res.ok) show(t("common.saved")); else show(t("common.error"), "err");
  };

  const saveWorkspace = async () => {
    setWSSaving(true);
    const res = await fetch("/api/settings/workspace", { method: "PUT", headers: authHeader(),
      body: JSON.stringify({ terminology, modules, simpleMode, dashboardWidgets: dashWidgets }) });
    setWSSaving(false);
    if (res.ok) show(t("common.saved")); else show(t("common.error"), "err");
  };

  const saveCustomFields = async () => {
    setCFSaving(true);
    const res = await fetch("/api/onboarding/custom-fields", { method: "PATCH", headers: authHeader(),
      body: JSON.stringify({ customClientFields: ccf, customBookingFields: cbf, customInventoryFields: cifFields }) });
    setCFSaving(false);
    if (res.ok) show(t("common.saved")); else show(t("common.error"), "err");
  };

  const makeCF = (setter: React.Dispatch<React.SetStateAction<any[]>>, fields: any[]) => ({
    add: () => setter([...fields, { id: `cf_${Date.now()}`, label: "", type: "text", placeholder: "" }]),
    remove: (id: string) => setter(fields.filter((f: any) => f.id !== id)),
    update: (id: string, key: string, val: any) => setter(fields.map((f: any) => f.id === id ? { ...f, [key]: val } : f)),
  });

  const saveLanguage = async (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("nf_lang", code);
    await fetch("/api/settings/language", { method: "PUT", headers: authHeader(), body: JSON.stringify({ language: code }) });
    show(t("common.saved"));
  };

  const saveNotifications = async (updated: any) => {
    setSettings((prev: any) => ({ ...prev, notifications: updated }));
    await fetch("/api/settings/notifications", { method: "PUT", headers: authHeader(), body: JSON.stringify({ notifications: updated }) });
  };

  const saveAI = async (updated: any) => {
    setSettings((prev: any) => ({ ...prev, aiPrefs: updated }));
    await fetch("/api/settings/ai", { method: "PUT", headers: authHeader(), body: JSON.stringify({ aiPrefs: updated }) });
    show(t("common.saved"));
  };

  const saveHours = (day: string, field: string, value: any) => {
    const updated = { ...settings.operatingHours, [day]: { ...(settings.operatingHours?.[day] || {}), [field]: value } };
    setSettings((prev: any) => ({ ...prev, operatingHours: updated }));
  };

  const connectIntegration = async (id: string, connected: boolean) => {
    const updated = { ...settings.integrations, [id]: { ...settings.integrations?.[id], connected } };
    setSettings((prev: any) => ({ ...prev, integrations: updated }));
    await fetch("/api/settings/integrations", { method: "PUT", headers: authHeader(), body: JSON.stringify({ integrations: updated }) });
    show(connected ? "Connected!" : "Disconnected");
  };

  const saveRazorpay = async () => {
    const updated = { ...settings.integrations, razorpay: { keyId: rzpKey, keySecret: rzpSecret, connected: !!rzpKey } };
    setSettings((prev: any) => ({ ...prev, integrations: updated }));
    await fetch("/api/settings/integrations", { method: "PUT", headers: authHeader(), body: JSON.stringify({ integrations: updated }) });
    show(t("common.saved"));
  };

  const sendInvite = async () => {
    if (!teamEmail.trim()) return;
    setInviting(true);
    const res = await fetch("/api/settings/team/invite", { method: "POST", headers: authHeader(), body: JSON.stringify({ email: teamEmail, role: teamRole, name: teamName }) });
    setInviting(false);
    if (res.ok) {
      const d = await res.json();
      setSettings((prev: any) => ({ ...prev, teamMembers: [...(prev.teamMembers || []), d.member] }));
      setTE(""); setTN(""); show("Invite sent!");
    } else show(t("common.error"), "err");
  };

  const removeMember = async (id: string) => {
    await fetch(`/api/settings/team/${id}`, { method: "DELETE", headers: authHeader() });
    setSettings((prev: any) => ({ ...prev, teamMembers: (prev.teamMembers || []).filter((m: any) => m.id !== id) }));
    show("Member removed");
  };

  const exportData = (type: string) => {
    const a = document.createElement("a");
    a.href = `/api/settings/export/${type}`;
    a.download = `${type}-export.csv`;
    const token = localStorage.getItem("nf_token");
    fetch(a.href, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(b => { a.href = URL.createObjectURL(b); a.click(); });
  };

  const deleteAccount = async () => {
    if (deleteConf !== "DELETE") return;
    setDeleting(true);
    const res = await fetch("/api/settings/account", { method: "DELETE", headers: authHeader(), body: JSON.stringify({ confirmation: "DELETE" }) });
    setDeleting(false);
    if (res.ok) { localStorage.removeItem("nf_token"); setLocation("/"); }
    else show(t("common.error"), "err");
  };

  const resetAIWorkspace = async () => {
    await fetch("/api/settings/workspace", { method: "PUT", headers: authHeader(), body: JSON.stringify({ terminology: DEFAULT_TERMINOLOGY }) });
    setLocation("/onboarding");
  };

  const notif = settings.notifications || {};
  const aiPrefs = settings.aiPrefs || { enabled: true, frequency: "balanced", tone: "friendly" };
  const integrations = settings.integrations || {};
  const teamMembers = settings.teamMembers || [];
  const currentLang = ws.language || "en";

  const updateNotifEvent = (event: string, channel: string, value: boolean) => {
    saveNotifications({ ...notif, [event]: { ...(notif[event] || {}), [channel]: value } });
  };

  if (loading) return (
    <AppLayout><div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>
  );

  return (
    <AppLayout>
      <Toast toast={toast} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
      </div>

      {/* ── Horizontal mobile sub-nav (outside flex row so it's full width) ── */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 w-full">
        {SUB_NAV.map(({ id, icon: Icon, key }) => (
          <button key={id} onClick={() => scrollTo(id)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
              activeSection === id ? "bg-primary/10 text-primary" : "text-muted-foreground border border-border hover:text-foreground")}>
            <Icon className="w-3.5 h-3.5" /> {t(`settings.sections.${key}`)}
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left Sub-Nav (desktop only) ── */}
        <aside className="hidden lg:flex flex-col gap-1 w-44 shrink-0 sticky top-4">
          {SUB_NAV.map(({ id, icon: Icon, key }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left",
                activeSection === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
              <Icon className="w-4 h-4 shrink-0" />
              {t(`settings.sections.${key}`)}
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 space-y-6 min-w-0 pb-28">

          {/* ── PROFILE ── */}
          <div ref={el => sectionRefs.current["profile"] = el}>
            <Card id="profile" icon={User} title={t("settings.profile.title")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t("settings.profile.fullName")}>
                  <Input value={profile.name || ""} onChange={v => setProfile((p: any) => ({ ...p, name: v }))} />
                </Field>
                <Field label={t("settings.profile.email")}>
                  <Input value={profile.email || ""} onChange={v => setProfile((p: any) => ({ ...p, email: v }))} type="email" />
                </Field>
                <Field label={t("settings.profile.businessName")}>
                  <Input value={profile.businessName || ""} onChange={v => setProfile((p: any) => ({ ...p, businessName: v }))} />
                </Field>
                <Field label={t("settings.profile.phone")}>
                  <Input value={profile.phone || ""} onChange={v => setProfile((p: any) => ({ ...p, phone: v }))} type="tel" />
                </Field>
                <Field label={t("settings.profile.address")}>
                  <Input value={profile.address || ""} onChange={v => setProfile((p: any) => ({ ...p, address: v }))} />
                </Field>
                <Field label={t("settings.profile.city")}>
                  <Input value={profile.city || ""} onChange={v => setProfile((p: any) => ({ ...p, city: v }))} />
                </Field>
                <Field label={t("settings.profile.currency")}>
                  <Select value={profile.currency || "INR"} onChange={v => setProfile((p: any) => ({ ...p, currency: v }))}>
                    <option value="INR">INR (₹) — Indian Rupee</option>
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — Pound</option>
                  </Select>
                </Field>
                <Field label={t("settings.profile.timezone")}>
                  <Select value="Asia/Kolkata" onChange={() => {}}>
                    <option value="Asia/Kolkata">IST — India Standard Time (UTC+5:30)</option>
                    <option value="UTC">UTC — Coordinated Universal Time</option>
                    <option value="America/New_York">EST — Eastern Time</option>
                    <option value="Europe/London">GMT — Greenwich Mean Time</option>
                  </Select>
                </Field>
              </div>

              {/* Operating Hours */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("settings.profile.operatingHours")}</p>
                <div className="space-y-1.5">
                  {DAYS.map(day => {
                    const h = settings.operatingHours?.[day] || { open: true, from: "09:00", to: "18:00" };
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="w-8 text-xs font-medium text-muted-foreground">{DAY_LABELS[day]}</span>
                        <Toggle value={h.open} onChange={v => saveHours(day, "open", v)} />
                        {h.open ? (
                          <div className="flex items-center gap-2 text-xs">
                            <input type="time" value={h.from} onChange={e => saveHours(day, "from", e.target.value)}
                              className="bg-background border border-border rounded-lg px-2 py-1 text-foreground [color-scheme:dark] focus:outline-none" />
                            <span className="text-muted-foreground">—</span>
                            <input type="time" value={h.to} onChange={e => saveHours(day, "to", e.target.value)}
                              className="bg-background border border-border rounded-lg px-2 py-1 text-foreground [color-scheme:dark] focus:outline-none" />
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Closed</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button onClick={saveProfile} disabled={profileSaving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60">
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("settings.profile.saveProfile")}
              </button>
            </Card>
          </div>

          {/* ── WORKSPACE ── */}
          <div ref={el => sectionRefs.current["workspace"] = el}>
            <Card id="workspace" icon={Briefcase} title={t("settings.workspace.title")}>
              {/* Re-run AI Setup */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t("settings.workspace.rerunSetup")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.workspace.rerunWarning")}</p>
                </div>
                <button onClick={() => setLocation("/onboarding")}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Re-run
                </button>
              </div>

              {/* Simple Mode */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.workspace.simpleMode")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.workspace.simpleModeDesc")}</p>
                </div>
                <Toggle value={simpleMode} onChange={setSM} />
              </div>

              {/* Module Manager */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("settings.workspace.moduleManager")}</p>
                <div className="space-y-1.5">
                  {MODULES.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-background border border-border/50 rounded-xl px-3 py-2">
                      <span className="text-sm text-foreground">{m.label}</span>
                      <Toggle value={modules.includes(m.id)} onChange={on => setModules(prev => on ? [...prev, m.id] : prev.filter(x => x !== m.id))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard Widgets */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("settings.workspace.dashboardWidgets")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {DASHBOARD_WIDGETS.map(w => (
                    <div key={w.id} className="flex items-center justify-between bg-background border border-border/50 rounded-xl px-3 py-2">
                      <span className="text-xs text-foreground">{w.label}</span>
                      <Toggle value={dashWidgets[w.id] !== false} onChange={on => setWidgets((p: any) => ({ ...p, [w.id]: on }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Terminology */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("settings.workspace.terminology")}</p>
                  <button onClick={() => setTerms(DEFAULT_TERMINOLOGY)} className="text-xs text-primary hover:underline">{t("settings.workspace.resetDefaults")}</button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{t("settings.workspace.terminologyDesc")}</p>
                <div className="space-y-2">
                  {Object.keys(DEFAULT_TERMINOLOGY).map(key => (
                    <div key={key} className="grid grid-cols-2 gap-2 items-center">
                      <span className="text-sm text-muted-foreground capitalize">{DEFAULT_TERMINOLOGY[key as keyof typeof DEFAULT_TERMINOLOGY]} →</span>
                      <input value={terminology[key] || ""} onChange={e => setTerms((p: any) => ({ ...p, [key]: e.target.value }))}
                        className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={saveWorkspace} disabled={wsSaving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60">
                {wsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("settings.workspace.saveWorkspace")}
              </button>
            </Card>
          </div>

          {/* ── CUSTOM FIELDS ── */}
          <div ref={el => sectionRefs.current["customFields"] = el}>
            <Card id="customFields" icon={Sparkles} title="Custom Fields">
              <p className="text-xs text-muted-foreground mb-4">Add extra fields that appear when creating clients, bookings, or inventory items. These are configured by your AI workspace and can be adjusted here.</p>

              {/* Tab bar */}
              <div className="flex gap-1 mb-5 bg-background p-1 rounded-xl border border-border">
                {([["clients", "Clients", ccf], ["bookings", "Bookings", cbf], ["inventory", "Inventory", cifFields]] as [string, string, any[]][]).map(([key, label, arr]) => (
                  <button key={key} onClick={() => setCFTab(key as any)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${cfTab === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {label} ({arr.length})
                  </button>
                ))}
              </div>

              {/* Field list */}
              {(() => {
                const [fields, setFields, key] = cfTab === "clients" ? [ccf, setCCF, "clients"] : cfTab === "bookings" ? [cbf, setCBF, "bookings"] : [cifFields, setCIF, "inventory"];
                const { add, remove, update } = makeCF(setFields as any, fields);
                return (
                  <div className="space-y-3">
                    {(fields as any[]).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6 bg-background/50 rounded-xl border border-dashed border-border">No custom fields yet. Click "Add Field" to create one.</p>
                    )}
                    {(fields as any[]).map((field: any) => (
                      <div key={field.id} className="bg-background border border-border rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={field.label} onChange={e => update(field.id, "label", e.target.value)}
                            placeholder="Field label (e.g. Dog Breed)"
                            className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                          <select value={field.type} onChange={e => update(field.id, "type", e.target.value)}
                            className="bg-card border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                            {["text","number","textarea","select","date","phone","checkbox"].map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                          <button onClick={() => remove(field.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input value={field.placeholder || ""} onChange={e => update(field.id, "placeholder", e.target.value)}
                          placeholder="Placeholder text (optional)"
                          className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        {field.type === "select" && (
                          <input value={(field.options || []).join(",")} onChange={e => update(field.id, "options", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                            placeholder="Options comma-separated (e.g. Small,Medium,Large)"
                            className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        )}
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id={`req_${field.id}`} checked={!!field.required} onChange={e => update(field.id, "required", e.target.checked)} className="accent-primary" />
                          <label htmlFor={`req_${field.id}`} className="text-xs text-muted-foreground cursor-pointer">Required</label>
                        </div>
                      </div>
                    ))}
                    <button onClick={add}
                      className="w-full py-2 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Field
                    </button>
                  </div>
                );
              })()}

              <button onClick={saveCustomFields} disabled={cfSaving}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60 mt-5">
                {cfSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Custom Fields
              </button>
            </Card>
          </div>

          {/* ── NOTIFICATIONS ── */}
          <div ref={el => sectionRefs.current["notifications"] = el}>
            <Card id="notifications" icon={Bell} title={t("settings.notifications.title")}>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <th className="text-left py-2 pl-1 pr-4">Event</th>
                      <th className="text-center py-2 px-3">{t("settings.notifications.inApp")}</th>
                      <th className="text-center py-2 px-3">WhatsApp</th>
                      <th className="text-center py-2 px-3">{t("settings.notifications.email")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {[
                      ["newBooking",     "settings.notifications.newBooking"    ],
                      ["invoiceOverdue", "settings.notifications.invoiceOverdue"],
                      ["lowStock",       "settings.notifications.lowStock"      ],
                      ["taskDue",        "settings.notifications.taskDue"       ],
                      ["newReview",      "settings.notifications.newReview"     ],
                    ].map(([event, tKey]) => (
                      <tr key={event}>
                        <td className="py-2.5 pl-1 pr-4 font-medium text-foreground">{t(tKey)}</td>
                        {(["inApp","whatsapp","email"] as const).map(ch => (
                          <td key={ch} className="text-center py-2.5 px-3">
                            <input type="checkbox" checked={notif[event]?.[ch] !== false}
                              onChange={e => updateNotifEvent(event, ch, e.target.checked)}
                              className="w-4 h-4 rounded accent-primary cursor-pointer" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quiet Hours */}
              <div className="flex items-center justify-between border-t border-border/30 pt-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifications.quietHours")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifications.quietHoursDesc")}</p>
                </div>
                <Toggle value={notif.quietHours?.enabled || false} onChange={v => saveNotifications({ ...notif, quietHours: { ...notif.quietHours, enabled: v } })} />
              </div>
              {notif.quietHours?.enabled && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <input type="time" value={notif.quietHours?.from || "22:00"} onChange={e => saveNotifications({ ...notif, quietHours: { ...notif.quietHours, from: e.target.value } })}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-foreground [color-scheme:dark] focus:outline-none text-sm" />
                  <span className="text-muted-foreground">to</span>
                  <input type="time" value={notif.quietHours?.to || "07:00"} onChange={e => saveNotifications({ ...notif, quietHours: { ...notif.quietHours, to: e.target.value } })}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-foreground [color-scheme:dark] focus:outline-none text-sm" />
                </div>
              )}

              {/* Weekly Digest */}
              <div className="flex items-center justify-between border-t border-border/30 pt-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.notifications.weeklyDigest")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.notifications.weeklyDigestDesc")}</p>
                </div>
                <Toggle value={notif.weeklyDigest !== false} onChange={v => saveNotifications({ ...notif, weeklyDigest: v })} />
              </div>
            </Card>
          </div>

          {/* ── LANGUAGE ── */}
          <div ref={el => sectionRefs.current["language"] = el}>
            <Card id="language" icon={Globe} title={t("settings.language.title")}>
              <p className="text-sm text-muted-foreground">{t("settings.language.current")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => lang.available && saveLanguage(lang.code)} disabled={!lang.available}
                    className={cn("relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-center",
                      currentLang === lang.code ? "border-primary bg-primary/10 text-primary" : lang.available ? "border-border hover:border-primary/40 text-foreground hover:bg-white/5" : "border-border/30 text-muted-foreground/50 cursor-not-allowed opacity-60")}>
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-xs font-semibold leading-tight">{lang.label}</span>
                    <span className="text-xs leading-tight opacity-70">{lang.native}</span>
                    {!lang.available && (
                      <span className="absolute top-1.5 right-1.5 text-xs bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-full leading-tight">soon</span>
                    )}
                    {currentLang === lang.code && (
                      <span className="absolute top-1.5 right-1.5"><Check className="w-3.5 h-3.5 text-primary" /></span>
                    )}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* ── TEAM ── */}
          <div ref={el => sectionRefs.current["team"] = el}>
            <Card id="team" icon={Users} title={t("settings.team.title")}>
              {/* Invite */}
              <div className="bg-background border border-border/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">{t("settings.team.invite")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={teamName} onChange={e => setTN(e.target.value)} placeholder="Name"
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                  <input value={teamEmail} onChange={e => setTE(e.target.value)} placeholder={t("settings.team.emailPlaceholder")} type="email"
                    className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                  <Select value={teamRole} onChange={setTR}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </Select>
                </div>
                <button onClick={sendInvite} disabled={inviting || !teamEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50">
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {t("settings.team.sendInvite")}
                </button>
              </div>

              {/* Members list */}
              {teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet. Invite someone to get started.</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("settings.team.members")}</p>
                  {teamMembers.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-3 bg-background border border-border/50 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {(m.name || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name || m.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                        m.role === "manager" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400")}>
                        {m.role}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", m.status === "active" ? "bg-teal-500/10 text-teal-400" : "bg-amber-500/10 text-amber-400")}>
                        {m.status === "active" ? t("settings.team.active") : t("settings.team.invited")}
                      </span>
                      <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Permissions table */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Role Permissions</p>
                <div className="space-y-2">
                  {ROLE_PERMISSIONS.map(r => (
                    <div key={r.role} className="flex items-start gap-3 bg-background border border-border/50 rounded-xl p-3">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-semibold shrink-0", r.color)}>{r.role}</span>
                      <p className="text-xs text-muted-foreground">{r.perms}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ── BILLING ── */}
          <div ref={el => sectionRefs.current["billing"] = el}>
            <Card id="billing" icon={CreditCard} title={t("settings.billing.title")}>
              {/* Current plan */}
              <div className="rounded-2xl p-4 bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("settings.billing.currentPlan")}</p>
                    <p className="text-xl font-bold text-foreground mt-0.5">{t("settings.billing.free")}</p>
                  </div>
                  <span className="bg-muted/30 text-muted-foreground text-xs px-3 py-1 rounded-full">Free Forever</span>
                </div>
                <ul className="space-y-1.5">
                  {FREE_FEATURES.map(f => <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="w-3.5 h-3.5 text-primary shrink-0" />{f}</li>)}
                </ul>
              </div>

              {/* Upgrade */}
              <div className="rounded-2xl p-4 border-2 border-primary/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">RECOMMENDED</div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("settings.billing.upgradeTitle")}</p>
                    <p className="text-2xl font-extrabold text-foreground mt-0.5">{t("settings.billing.upgradePrice")}</p>
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {PREMIUM_FEATURES.map(f => <li key={f} className="flex items-center gap-2 text-xs text-foreground"><Zap className="w-3.5 h-3.5 text-primary shrink-0" />{f}</li>)}
                </ul>
                <button onClick={() => show("Payment integration coming soon!")}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-all">
                  Upgrade to Premium
                </button>
              </div>

              {/* Comparison */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[320px]">
                  <thead><tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground">Feature</th>
                    <th className="text-center py-2 text-muted-foreground">Free</th>
                    <th className="text-center py-2 text-primary">Premium</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border/20 text-muted-foreground">
                    {[["Clients","50","Unlimited"],["Bookings/month","100","Unlimited"],["Invoices","50","Unlimited"],["Team members","1","5"],["AI Assistant","Basic","Full"],["Public Page","With branding","Custom"]].map(([f,fr,pr]) => (
                      <tr key={f}><td className="py-2">{f}</td><td className="text-center py-2">{fr}</td><td className="text-center py-2 text-primary font-medium">{pr}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* ── INTEGRATIONS ── */}
          <div ref={el => sectionRefs.current["integrations"] = el}>
            <Card id="integrations" icon={Link2} title={t("settings.integrations.title")}>
              <div className="space-y-3">
                {INTEGRATIONS_LIST.map(intg => {
                  const isConnected = integrations[intg.id]?.connected;
                  return (
                    <div key={intg.id} className="bg-background border border-border/50 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{intg.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{intg.label}</p>
                            <p className="text-xs text-muted-foreground">{intg.desc}</p>
                          </div>
                        </div>
                        {!intg.hasKey && (
                          <button onClick={() => connectIntegration(intg.id, !isConnected)}
                            className={cn("shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all",
                              isConnected ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-primary/10 text-primary hover:bg-primary/20")}>
                            {isConnected ? t("settings.integrations.disconnect") : t("settings.integrations.connect")}
                          </button>
                        )}
                        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium shrink-0",
                          isConnected ? "bg-teal-500/10 text-teal-400" : "bg-muted/30 text-muted-foreground")}>
                          {isConnected ? t("settings.integrations.connected") : t("settings.integrations.notConnected")}
                        </span>
                      </div>
                      {intg.hasKey && (
                        <div className="mt-3 space-y-2">
                          <input value={rzpKey} onChange={e => setRZK(e.target.value)} placeholder={t("settings.integrations.apiKeyId")}
                            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                          <input value={rzpSecret} onChange={e => setRZS(e.target.value)} placeholder={t("settings.integrations.apiKeySecret")} type="password"
                            className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none" />
                          <button onClick={saveRazorpay}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors">
                            <Save className="w-3.5 h-3.5" /> {t("settings.integrations.save")}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── DATA & PRIVACY ── */}
          <div ref={el => sectionRefs.current["dataPrivacy"] = el}>
            <Card id="dataPrivacy" icon={Shield} title={t("settings.data.title")}>
              {/* Export */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("settings.data.export")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[["clients","Clients"],["bookings","Bookings"],["invoices","Invoices"],["inventory","Inventory"],["tasks","Tasks"]].map(([type, label]) => (
                    <button key={type} onClick={() => exportData(type)}
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors">
                      <Download className="w-3.5 h-3.5 text-primary" /> {label} CSV
                    </button>
                  ))}
                </div>
              </div>

              {/* Backup */}
              <div className="flex items-center justify-between bg-background border border-border/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.data.backup")}</p>
                  <p className="text-xs text-muted-foreground">Last backed up: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className="text-xs bg-teal-500/10 text-teal-400 px-2.5 py-1 rounded-full">Up to date</span>
              </div>

              {/* Directory */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.data.directory")}</p>
                  <p className="text-xs text-muted-foreground">Appear in the NicheFlow discovery directory (coming soon)</p>
                </div>
                <Toggle value={settings.showInDirectory !== false} onChange={v => {
                  setSettings((p: any) => ({ ...p, showInDirectory: v }));
                  fetch("/api/settings/ai", { method: "PUT", headers: authHeader(), body: JSON.stringify({ aiPrefs: aiPrefs }) });
                }} />
              </div>

              {/* Delete Account */}
              <div className="border-t border-red-500/20 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-red-400">{t("settings.data.deleteAccount")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("settings.data.deleteWarning")}</p>
                  </div>
                  <button onClick={() => setSDel(true)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* ── AI PREFERENCES ── */}
          <div ref={el => sectionRefs.current["aiPreferences"] = el}>
            <Card id="aiPreferences" icon={Sparkles} title={t("settings.ai.title")}>
              {/* AI Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("settings.ai.enabled")}</p>
                  <p className="text-xs text-muted-foreground">Enable AI-powered suggestions and automation</p>
                </div>
                <Toggle value={aiPrefs.enabled !== false} onChange={v => saveAI({ ...aiPrefs, enabled: v })} />
              </div>

              {/* Frequency */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("settings.ai.frequency")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[["aggressive", t("settings.ai.aggressive")], ["balanced", t("settings.ai.balanced")], ["minimal", t("settings.ai.minimal")]].map(([val, label]) => (
                    <button key={val} onClick={() => saveAI({ ...aiPrefs, frequency: val })}
                      className={cn("py-2 rounded-xl text-sm font-medium border transition-all",
                        aiPrefs.frequency === val ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{t("settings.ai.tone")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {[["formal", t("settings.ai.formal")], ["friendly", t("settings.ai.friendly")]].map(([val, label]) => (
                    <button key={val} onClick={() => saveAI({ ...aiPrefs, tone: val })}
                      className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all",
                        aiPrefs.tone === val ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset AI Workspace */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t("settings.ai.resetWorkspace")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("settings.ai.resetWarning")}</p>
                </div>
                <button onClick={resetAIWorkspace}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </Card>
          </div>

          <div className="h-12" />
        </div>
      </div>

      {/* ── Delete Account Modal ── */}
      <AnimatePresence>
        {showDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSDel(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-400" /></div>
                  <div>
                    <h3 className="font-bold text-foreground">Delete Account</h3>
                    <p className="text-xs text-muted-foreground">This cannot be undone</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("settings.data.deleteWarning")}</p>
                <p className="text-sm font-medium text-foreground mb-2">Type <strong className="text-red-400">DELETE</strong> to confirm:</p>
                <input value={deleteConf} onChange={e => setDelConf(e.target.value)} placeholder="DELETE"
                  className="w-full bg-background border border-red-500/30 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none mb-4" />
                <div className="flex gap-2">
                  <button onClick={() => { setSDel(false); setDelConf(""); }}
                    className="flex-1 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                  <button onClick={deleteAccount} disabled={deleteConf !== "DELETE" || deleting}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
