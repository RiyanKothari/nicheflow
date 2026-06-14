import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Copy, ExternalLink, Loader2, Check, Zap, Plus, Trash2,
  Eye, EyeOff, GripVertical, Star, Smartphone, Monitor,
  BarChart2, MessageSquare, ChevronDown, ChevronUp, Palette,
  Save, RefreshCw, Phone, Mail, MapPin, Instagram, Youtube, Link,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Service = { id: number; name: string; duration: string; price: number; description: string; showBookButton: boolean };

type PageState = {
  tagline: string; coverPhotoUrl: string; aboutText: string; showAbout: boolean;
  services: Service[]; showServices: boolean; showContact: boolean; showReviews: boolean;
  showBookingWidget: boolean; accentColor: string; socialInstagram: string;
  socialFacebook: string; socialYoutube: string; whatsappEnabled: boolean; mapsLink: string;
  businessName: string; phone: string; email: string; address: string; city: string; slug: string;
};

type Review = { id: number; clientName: string; rating: number; comment: string | null; isVisible: boolean; createdAt: string };

const ACCENT_COLORS = [
  { label: "Purple",  value: "#7c3aed" },
  { label: "Teal",    value: "#0d9488" },
  { label: "Blue",    value: "#2563eb" },
  { label: "Orange",  value: "#ea580c" },
  { label: "Rose",    value: "#e11d48" },
  { label: "Green",   value: "#16a34a" },
  { label: "Indigo",  value: "#4f46e5" },
  { label: "Amber",   value: "#d97706" },
];

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}

// ── Section Accordion ──────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = true, extra }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {extra}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Toggle Row ─────────────────────────────────────────────────────────────────

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-foreground">{label}</span>
      <button onClick={() => onChange(!value)}
        className={cn("w-10 h-5 rounded-full transition-all relative", value ? "bg-primary" : "bg-muted/50")}>
        <div className={cn("w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm", value ? "left-5" : "left-0.5")} />
      </button>
    </div>
  );
}

// ── Star Rating ────────────────────────────────────────────────────────────────

function Stars({ rating, size = 4 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={cn(`w-${size} h-${size}`, i <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
      ))}
    </div>
  );
}

// ── Live Preview ───────────────────────────────────────────────────────────────

function LivePreview({ state, business, mobile }: { state: PageState; business: any; mobile: boolean }) {
  const accent = state.accentColor;
  const name = state.businessName || business?.name || "Business";
  const services = (state.services as Service[]) || [];

  return (
    <div className={cn("bg-[#0a0a0f] text-white rounded-2xl overflow-hidden transition-all duration-300", mobile ? "max-w-[375px] mx-auto" : "w-full")} style={{ minHeight: 600 }}>
      {/* Cover */}
      <div className="relative h-36 overflow-hidden" style={{ background: state.coverPhotoUrl ? `url(${state.coverPhotoUrl}) center/cover` : `linear-gradient(135deg, ${accent}33, ${accent}11)` }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,15,1) 0%, transparent 60%)" }} />
        <div className="absolute bottom-0 left-4 flex items-end gap-3 pb-3">
          <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center text-xl font-bold shadow-lg" style={{ background: accent }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="pb-1">
            <h1 className="text-base font-bold leading-tight">{name}</h1>
            {state.tagline && <p className="text-xs text-white/70">{state.tagline}</p>}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 text-sm">
        {/* Accent nav line */}
        <div className="h-0.5 rounded-full" style={{ background: accent, opacity: 0.5 }} />

        {/* About */}
        {state.showAbout && state.aboutText && (
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wide mb-1.5" style={{ color: accent }}>About</h2>
            <p className="text-white/70 text-xs leading-relaxed line-clamp-4">{state.aboutText}</p>
          </div>
        )}

        {/* Services */}
        {state.showServices && services.length > 0 && (
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wide mb-2" style={{ color: accent }}>Services</h2>
            <div className="space-y-2">
              {services.slice(0, 3).map(s => (
                <div key={s.id} className="rounded-xl p-2.5 flex items-center justify-between" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                  <div>
                    <p className="font-medium text-xs">{s.name}</p>
                    <p className="text-white/50 text-xs">{s.duration} · ₹{s.price}</p>
                  </div>
                  {s.showBookButton && (
                    <div className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: accent }}>Book</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        {state.showContact && (state.phone || state.email || state.address) && (
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wide mb-1.5" style={{ color: accent }}>Contact</h2>
            <div className="space-y-1.5">
              {state.phone && <div className="flex items-center gap-2 text-xs text-white/70"><Phone className="w-3 h-3" style={{ color: accent }} />{state.phone}</div>}
              {state.email && <div className="flex items-center gap-2 text-xs text-white/70"><Mail className="w-3 h-3" style={{ color: accent }} />{state.email}</div>}
              {state.address && <div className="flex items-center gap-2 text-xs text-white/70"><MapPin className="w-3 h-3" style={{ color: accent }} />{state.address}</div>}
            </div>
            {state.whatsappEnabled && state.phone && (
              <div className="mt-2 text-xs font-semibold py-1.5 rounded-xl text-center" style={{ background: "#25d366", color: "white" }}>💬 WhatsApp</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 text-center">
          <p className="text-white/20 text-xs">Powered by NicheFlow</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Editor ────────────────────────────────────────────────────────────────

export function PublicPageEditor() {
  const [state, setState]       = useState<PageState>({
    tagline: "", coverPhotoUrl: "", aboutText: "", showAbout: true,
    services: [], showServices: true, showContact: true, showReviews: true,
    showBookingWidget: true, accentColor: "#7c3aed",
    socialInstagram: "", socialFacebook: "", socialYoutube: "",
    whatsappEnabled: true, mapsLink: "",
    businessName: "", phone: "", email: "", address: "", city: "", slug: "",
  });
  const [business, setBiz]      = useState<any>(null);
  const [ws, setWS]             = useState<any>(null);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [mobile, setMobile]     = useState(true);
  const [aiTaglineLoading, setATL] = useState(false);
  const [aiAboutLoading, setAAL]   = useState(false);
  const [newService, setNS]     = useState<Partial<Service>>({ name: "", duration: "60 min", price: 0, description: "", showBookButton: true });
  const [showAddService, setSAS] = useState(false);
  const [copied, setCopied]     = useState(false);

  const set = (field: keyof PageState, value: any) => setState(prev => ({ ...prev, [field]: value }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const h = authHeader();
    const [cfg, analytics] = await Promise.all([
      fetch("/api/public-page", { headers: h }).then(r => r.ok ? r.json() : null),
      fetch("/api/public-page/analytics", { headers: h }).then(r => r.ok ? r.json() : null),
    ]);
    if (cfg) {
      setBiz(cfg.business); setWS(cfg.ws); setReviews(cfg.reviews || []);
      const c = cfg.config;
      setState({
        tagline: c.tagline || "", coverPhotoUrl: c.coverPhotoUrl || "",
        aboutText: c.aboutText || "", showAbout: c.showAbout,
        services: (c.services as Service[]) || [],
        showServices: c.showServices, showContact: c.showContact,
        showReviews: c.showReviews, showBookingWidget: c.showBookingWidget,
        accentColor: c.accentColor || "#7c3aed",
        socialInstagram: c.socialInstagram || "", socialFacebook: c.socialFacebook || "",
        socialYoutube: c.socialYoutube || "", whatsappEnabled: c.whatsappEnabled,
        mapsLink: c.mapsLink || "",
        businessName: cfg.business.name || "", phone: cfg.business.phone || "",
        email: cfg.business.email || "", address: cfg.business.address || "",
        city: cfg.business.city || "", slug: cfg.business.slug || "",
      });
    }
    if (analytics) setAnalytics(analytics);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const save = async () => {
    setSaving(true);
    await fetch("/api/public-page", { method: "PUT", headers: authHeader(), body: JSON.stringify(state) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateTagline = async () => {
    setATL(true);
    const res = await fetch("/api/public-page/ai/tagline", { method: "POST", headers: authHeader(),
      body: JSON.stringify({ businessName: state.businessName, niche: ws?.niche }) });
    if (res.ok) { const d = await res.json(); set("tagline", d.tagline); }
    setATL(false);
  };

  const generateAbout = async () => {
    setAAL(true);
    const res = await fetch("/api/public-page/ai/about", { method: "POST", headers: authHeader(),
      body: JSON.stringify({ businessName: state.businessName, niche: ws?.niche, city: state.city }) });
    if (res.ok) { const d = await res.json(); set("aboutText", d.about); }
    setAAL(false);
  };

  const addService = () => {
    if (!newService.name?.trim()) return;
    const service: Service = {
      id: Date.now(), name: newService.name!, duration: newService.duration || "60 min",
      price: Number(newService.price) || 0, description: newService.description || "",
      showBookButton: newService.showBookButton !== false,
    };
    set("services", [...state.services, service]);
    setNS({ name: "", duration: "60 min", price: 0, description: "", showBookButton: true });
    setSAS(false);
  };

  const removeService = (id: number) => set("services", state.services.filter((s: Service) => s.id !== id));

  const updateService = (id: number, field: keyof Service, value: any) =>
    set("services", state.services.map((s: Service) => s.id === id ? { ...s, [field]: value } : s));

  const toggleReview = async (id: number, isVisible: boolean) => {
    await fetch(`/api/public-page/reviews/${id}`, { method: "PATCH", headers: authHeader(), body: JSON.stringify({ isVisible }) });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible } : r));
  };

  const copyLink = () => {
    const url = `${window.location.origin}/p/${state.slug || business?.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const publicUrl = state.slug || business?.slug ? `nicheflow.app/p/${state.slug || business?.slug}` : "Set a slug below";

  if (loading) return (
    <AppLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AppLayout>
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Public Page</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Build your professional business profile that clients can discover</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* URL Pill */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-mono text-muted-foreground">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary">{publicUrl}</span>
            </div>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <a href={`/p/${state.slug || business?.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-xl text-xs font-medium text-foreground hover:bg-white/5 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> View Live
            </a>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all disabled:opacity-70">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Analytics strip ── */}
        {analytics && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Page Views", value: analytics.viewCount ?? 0, Icon: BarChart2 },
              { label: "Reviews",    value: analytics.reviewCount ?? 0, Icon: Star },
              { label: "Avg Rating", value: analytics.avgRating ? `${analytics.avgRating}★` : "—", Icon: Star },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: Editor */}
          <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">

            {/* Business Identity */}
            <Section title="Business Identity">
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Business Name</label>
                  <input value={state.businessName} onChange={e => set("businessName", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">URL Slug</label>
                  <div className="flex items-center gap-1 bg-background border border-border rounded-xl overflow-hidden">
                    <span className="px-3 text-xs text-muted-foreground bg-muted/20 py-2 border-r border-border">nicheflow.app/p/</span>
                    <input value={state.slug} onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="your-business" className="flex-1 bg-transparent px-2 py-2 text-sm text-foreground focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tagline</label>
                  <div className="flex gap-2">
                    <input value={state.tagline} onChange={e => set("tagline", e.target.value)}
                      placeholder="Your short business tagline"
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={generateTagline} disabled={aiTaglineLoading}
                      className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors shrink-0">
                      {aiTaglineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} AI
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Cover Photo URL</label>
                  <input value={state.coverPhotoUrl} onChange={e => set("coverPhotoUrl", e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                {/* Accent Color */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Accent Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {ACCENT_COLORS.map(c => (
                      <button key={c.value} onClick={() => set("accentColor", c.value)} title={c.label}
                        className={cn("w-7 h-7 rounded-full border-2 transition-all", state.accentColor === c.value ? "border-white scale-110" : "border-transparent hover:scale-105")}
                        style={{ background: c.value }} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* About */}
            <Section title="About Section" extra={<ToggleRow label="" value={state.showAbout} onChange={v => set("showAbout", v)} />}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">About Text</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{state.aboutText.length} chars</span>
                    <button onClick={generateAbout} disabled={aiAboutLoading}
                      className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors">
                      {aiAboutLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} AI Write
                    </button>
                  </div>
                </div>
                <textarea value={state.aboutText} onChange={e => set("aboutText", e.target.value)} rows={5}
                  placeholder="Tell clients about your business, experience, and what makes you special…"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </Section>

            {/* Services */}
            <Section title="Services" extra={<ToggleRow label="" value={state.showServices} onChange={v => set("showServices", v)} />}>
              <div className="space-y-2">
                {state.services.map((s: Service) => (
                  <div key={s.id} className="bg-background border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <input value={s.name} onChange={e => updateService(s.id, "name", e.target.value)}
                          className="bg-transparent text-sm font-medium text-foreground focus:outline-none border-b border-transparent focus:border-primary/40" />
                      </div>
                      <button onClick={() => removeService(s.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Duration</label>
                        <input value={s.duration} onChange={e => updateService(s.id, "duration", e.target.value)}
                          placeholder="60 min" className="w-full bg-card border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none mt-0.5" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Price (₹)</label>
                        <input type="number" value={s.price} onChange={e => updateService(s.id, "price", Number(e.target.value))}
                          className="w-full bg-card border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none mt-0.5" />
                      </div>
                    </div>
                    <input value={s.description} onChange={e => updateService(s.id, "description", e.target.value)}
                      placeholder="Short description…" className="w-full bg-card border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none" />
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={s.showBookButton} onChange={e => updateService(s.id, "showBookButton", e.target.checked)} id={`sb-${s.id}`} className="rounded" />
                      <label htmlFor={`sb-${s.id}`} className="text-xs text-muted-foreground">Show "Book Now" button</label>
                    </div>
                  </div>
                ))}
                <AnimatePresence>
                  {showAddService && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="bg-background border border-primary/20 rounded-xl p-3 space-y-2">
                      <input value={newService.name} onChange={e => setNS(p => ({ ...p, name: e.target.value }))}
                        placeholder="Service name" className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={newService.duration} onChange={e => setNS(p => ({ ...p, duration: e.target.value }))}
                          placeholder="Duration (60 min)" className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                        <input type="number" value={newService.price} onChange={e => setNS(p => ({ ...p, price: Number(e.target.value) }))}
                          placeholder="Price ₹" className="bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                      </div>
                      <input value={newService.description} onChange={e => setNS(p => ({ ...p, description: e.target.value }))}
                        placeholder="Short description" className="w-full bg-card border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none" />
                      <div className="flex gap-2">
                        <button onClick={addService} className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">Add Service</button>
                        <button onClick={() => setSAS(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button onClick={() => setSAS(true)}
                  className="w-full flex items-center gap-1.5 justify-center py-2 rounded-xl border border-dashed border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Service
                </button>
              </div>
            </Section>

            {/* Contact */}
            <Section title="Contact Info" extra={<ToggleRow label="" value={state.showContact} onChange={v => set("showContact", v)} />}>
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Phone</label>
                    <input value={state.phone} onChange={e => set("phone", e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none mt-0.5" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Email</label>
                    <input value={state.email} onChange={e => set("email", e.target.value)} type="email"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none mt-0.5" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Address</label>
                  <input value={state.address} onChange={e => set("address", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">City</label>
                  <input value={state.city} onChange={e => set("city", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none mt-0.5" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Google Maps Link</label>
                  <input value={state.mapsLink} onChange={e => set("mapsLink", e.target.value)}
                    placeholder="https://maps.google.com/…"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none mt-0.5" />
                </div>
                <ToggleRow label="WhatsApp Button" value={state.whatsappEnabled} onChange={v => set("whatsappEnabled", v)} />
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Social Links</label>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                      <input value={state.socialInstagram} onChange={e => set("socialInstagram", e.target.value)}
                        placeholder="instagram.com/yourbusiness" className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-blue-400 shrink-0" />
                      <input value={state.socialFacebook} onChange={e => set("socialFacebook", e.target.value)}
                        placeholder="facebook.com/yourbusiness" className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-400 shrink-0" />
                      <input value={state.socialYoutube} onChange={e => set("socialYoutube", e.target.value)}
                        placeholder="youtube.com/@yourbusiness" className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* Reviews */}
            <Section title={`Reviews (${reviews.length})`} extra={<ToggleRow label="" value={state.showReviews} onChange={v => set("showReviews", v)} />}>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet. They'll appear here once clients submit them from your public page.</p>
              ) : (
                <div className="space-y-2">
                  {reviews.map(r => (
                    <div key={r.id} className={cn("bg-background border border-border rounded-xl p-3", !r.isVisible && "opacity-50")}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-foreground">{r.clientName}</span>
                            <Stars rating={r.rating} size={3} />
                          </div>
                          {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                        </div>
                        <button onClick={() => toggleReview(r.id, !r.isVisible)}
                          className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                          {r.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Booking Widget */}
            <Section title="Booking Widget">
              <ToggleRow label="Allow clients to book directly from your page" value={state.showBookingWidget} onChange={v => set("showBookingWidget", v)} />
              {state.showBookingWidget && (
                <p className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
                  Clients can select a service, pick a date and time, and submit their details — the booking will appear in your Bookings module.
                </p>
              )}
            </Section>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="sticky top-4 self-start">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Live Preview</span>
                <div className="flex items-center gap-1 bg-background rounded-xl border border-border overflow-hidden">
                  <button onClick={() => setMobile(true)} className={cn("p-2 transition-colors", mobile ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button onClick={() => setMobile(false)} className={cn("p-2 transition-colors", !mobile ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto bg-[#0a0a0f]">
                <LivePreview state={state} business={business} mobile={mobile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
