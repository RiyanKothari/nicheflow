import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Mail, MapPin, Tag, Plus, Edit2, Save, X, Trash2,
  Calendar, FileText, MessageSquare, Loader2, Sparkles, AlertTriangle,
  CheckCircle2, Clock, ChevronDown, ExternalLink, Send,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────────────────────────

type ClientNote = { id: number; content: string; createdAt: string };

type BookingItem = {
  id: number; title: string; status: string;
  scheduledAt: string; amount: number | null; duration: number | null;
};

type InvoiceItem = {
  id: number; invoiceNumber: string; status: string;
  total: number; dueDate: string | null; createdAt: string;
};

type ClientProfile = {
  id: number; name: string; email?: string | null; phone?: string | null;
  address?: string | null; notes?: string | null; tags: string[];
  customFields: Record<string, string>;
  totalSpent: number; bookingsCount: number; lastBookingAt?: string | null;
  createdAt: string;
  bookings: BookingItem[];
  invoices: InvoiceItem[];
  clientNotes: ClientNote[];
};

// ── constants ─────────────────────────────────────────────────────────────────

const PREDEFINED_TAGS = ["VIP", "New", "Inactive", "Overdue", "Returning", "At-Risk"];

const TAG_COLORS: Record<string, string> = {
  VIP:       "bg-amber-400/20 text-amber-400 border-amber-400/30",
  New:       "bg-primary/20 text-primary border-primary/30",
  Inactive:  "bg-muted/40 text-muted-foreground border-border",
  Overdue:   "bg-red-500/20 text-red-400 border-red-500/30",
  Returning: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "At-Risk": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const STATUS_BOOKING: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "bg-amber-400/10",    text: "text-amber-400" },
  confirmed: { bg: "bg-primary/10",      text: "text-primary" },
  completed: { bg: "bg-teal-500/10",     text: "text-teal-400" },
  cancelled: { bg: "bg-muted/30",        text: "text-muted-foreground" },
};

const STATUS_INVOICE: Record<string, { bg: string; text: string }> = {
  draft:    { bg: "bg-muted/30",     text: "text-muted-foreground" },
  pending:  { bg: "bg-amber-400/10", text: "text-amber-400" },
  paid:     { bg: "bg-teal-500/10",  text: "text-teal-400" },
  overdue:  { bg: "bg-red-500/10",   text: "text-red-400" },
};

// ── niche custom fields ───────────────────────────────────────────────────────

const NICHE_FIELDS: Record<string, { key: string; label: string }[]> = {
  "Dog Training": [
    { key: "dogName",       label: "Dog's Name" },
    { key: "breed",         label: "Breed" },
    { key: "dogAge",        label: "Dog's Age" },
    { key: "vaccination",   label: "Vaccination Status" },
    { key: "behavioral",    label: "Behavioral Notes" },
  ],
  "Tailoring": [
    { key: "chest",         label: "Chest (cm)" },
    { key: "waist",         label: "Waist (cm)" },
    { key: "hip",           label: "Hip (cm)" },
    { key: "length",        label: "Length (cm)" },
    { key: "fabricPref",    label: "Fabric Preferences" },
    { key: "styleNotes",    label: "Style Notes" },
  ],
  "Urban Farming": [
    { key: "plotSize",      label: "Plot Size (sq ft)" },
    { key: "cropType",      label: "Crop Type" },
    { key: "soilType",      label: "Soil Type" },
    { key: "lastPurchase",  label: "Last Purchase" },
  ],
  "Home Repair": [
    { key: "propertyType",  label: "Property Type" },
    { key: "lastService",   label: "Last Service Date" },
    { key: "preferredTime", label: "Preferred Time" },
  ],
  "Photography": [
    { key: "shootType",     label: "Shoot Type" },
    { key: "deliverables",  label: "Deliverables" },
    { key: "style",         label: "Style Preference" },
  ],
};

// ── helpers ───────────────────────────────────────────────────────────────────

function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}

function avatarColor(name: string) {
  const colors = ["bg-primary", "bg-teal-500", "bg-amber-500", "bg-pink-500", "bg-violet-500", "bg-sky-500"];
  let hash = 0; for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function timeAgo(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

// ── tag pill ──────────────────────────────────────────────────────────────────

function TagPill({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const cls = TAG_COLORS[tag] || "bg-muted/40 text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border", cls)}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// ── section card ──────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, action }: {
  title: string; icon: any; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── timeline item ─────────────────────────────────────────────────────────────

function TimelineItem({ icon: Icon, iconBg, children, date }: {
  icon: any; iconBg: string; children: React.ReactNode; date: string;
}) {
  return (
    <div className="flex gap-3">
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", iconBg)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        {children}
        <p className="text-xs text-muted-foreground mt-1">{timeAgo(date)}</p>
      </div>
    </div>
  );
}

// ── edit field ────────────────────────────────────────────────────────────────

function EditableField({ label, value, onSave, multiline }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  const save = () => { onSave(val); setEditing(false); };
  const cls  = "w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        {!editing && (
          <button onClick={() => { setVal(value); setEditing(true); }} className="text-xs text-primary hover:text-primary/80">Edit</button>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2">
          {multiline
            ? <textarea value={val} onChange={e => setVal(e.target.value)} rows={3} className={cn(cls, "resize-none flex-1")} />
            : <input value={val} onChange={e => setVal(e.target.value)} className={cn(cls, "flex-1")} />
          }
          <div className="flex flex-col gap-1">
            <button onClick={save} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Save className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground bg-background border border-border/50 rounded-xl px-3 py-2 min-h-[36px]">
          {value || <span className="text-muted-foreground italic">Not set</span>}
        </p>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient]     = useState<ClientProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [workspace, setWorkspace] = useState<any>(null);

  const [noteText, setNoteText]       = useState("");
  const [addingNote, setAddingNote]   = useState(false);
  const [showTagDrop, setShowTagDrop] = useState(false);

  const [aiInsight, setAiInsight]     = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [atRisk, setAtRisk]           = useState(false);

  const [timelineLimit, setTimelineLimit] = useState(5);

  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    Promise.all([
      fetch(`/api/clients/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : Promise.reject()),
      fetch("/api/onboarding/config", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
    ]).then(([c, w]) => {
      setClient(c); setWorkspace(w);
      // Auto at-risk check
      if (c.lastBookingAt) {
        const days = (Date.now() - new Date(c.lastBookingAt).getTime()) / (86400000);
        if (days > 30) setAtRisk(true);
      } else if (c.createdAt) {
        const daysSince = (Date.now() - new Date(c.createdAt).getTime()) / (86400000);
        if (daysSince > 14 && c.bookingsCount === 0) setAtRisk(true);
      }
    }).catch(() => setError("Failed to load client profile."))
      .finally(() => setLoading(false));
  }, [id]);

  const saveField = async (field: string, value: any) => {
    if (!client) return;
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT", headers: authHeader(), body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) { const updated = await res.json(); setClient(prev => prev ? { ...prev, ...updated } : null); }
  };

  const saveCustomField = async (key: string, value: string) => {
    if (!client) return;
    const newFields = { ...client.customFields, [key]: value };
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT", headers: authHeader(), body: JSON.stringify({ customFields: newFields }),
    });
    if (res.ok) setClient(prev => prev ? { ...prev, customFields: newFields } : null);
  };

  const toggleTag = async (tag: string) => {
    if (!client) return;
    const newTags = client.tags.includes(tag) ? client.tags.filter(t => t !== tag) : [...client.tags, tag];
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT", headers: authHeader(), body: JSON.stringify({ tags: newTags }),
    });
    if (res.ok) setClient(prev => prev ? { ...prev, tags: newTags } : null);
    setShowTagDrop(false);
  };

  const addNote = async () => {
    if (!noteText.trim() || !client) return;
    setAddingNote(true);
    const res = await fetch(`/api/clients/${id}/notes`, {
      method: "POST", headers: authHeader(), body: JSON.stringify({ content: noteText.trim() }),
    });
    if (res.ok) {
      const note = await res.json();
      setClient(prev => prev ? { ...prev, clientNotes: [note, ...prev.clientNotes] } : null);
      setNoteText("");
    }
    setAddingNote(false);
  };

  const deleteNote = async (noteId: number) => {
    await fetch(`/api/clients/${id}/notes/${noteId}`, { method: "DELETE", headers: authHeader() });
    setClient(prev => prev ? { ...prev, clientNotes: prev.clientNotes.filter(n => n.id !== noteId) } : null);
  };

  const generateInsight = async () => {
    if (!client) return;
    setAiLoading(true); setAiInsight("");
    const summary = `Client: ${client.name}. Bookings: ${client.bookingsCount}. Total spent: ₹${client.totalSpent}. Last booking: ${client.lastBookingAt ? formatDate(client.lastBookingAt) : "Never"}. Member since: ${formatDate(client.createdAt)}.`;
    try {
      const res = await fetch("/api/ai/insight", {
        method: "POST", headers: authHeader(),
        body: JSON.stringify({ prompt: `Give a 2-sentence business insight about this client in a friendly, professional tone: ${summary}` }),
      });
      if (res.ok) { const d = await res.json(); setAiInsight(d.insight || d.content || ""); }
      else setAiInsight(`${client.name} has been a valued client with ${client.bookingsCount} booking(s) and ₹${client.totalSpent.toLocaleString("en-IN")} in total spend since ${formatDate(client.createdAt)}.`);
    } catch { setAiInsight(`${client.name} has been a valued client with ${client.bookingsCount} booking(s) and ₹${client.totalSpent.toLocaleString("en-IN")} in total spend since ${formatDate(client.createdAt)}.`); }
    setAiLoading(false);
  };

  // Build combined timeline
  const timeline = client ? [
    ...client.bookings.map(b => ({ type: "booking" as const, date: b.scheduledAt, data: b })),
    ...client.invoices.map(i => ({ type: "invoice" as const, date: i.createdAt, data: i })),
    ...client.clientNotes.map(n => ({ type: "note" as const, date: n.createdAt, data: n })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  // Niche custom fields
  const niche = workspace?.niche || workspace?.terminology?.niche || "";
  const nicheFields = NICHE_FIELDS[niche] || [];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (error || !client) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-semibold text-foreground mb-2">Client not found</p>
          <Link href="/clients">
            <button className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back to clients</button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* ── Back ── */}
        <Link href="/clients">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to clients
          </button>
        </Link>

        {/* ── Profile Header ── */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Avatar */}
            <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0", avatarColor(client.name))}>
              {initials(client.name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
                    {client.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
                    {client.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
                    {client.address && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{client.address}</span>}
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex gap-2 flex-wrap">
                  <Link href="/bookings">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-xl hover:bg-primary/20 transition-colors">
                      <Calendar className="w-3.5 h-3.5" /> New Booking
                    </button>
                  </Link>
                  <Link href="/invoices">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 text-teal-400 text-xs font-medium rounded-xl hover:bg-teal-500/20 transition-colors">
                      <FileText className="w-3.5 h-3.5" /> New Invoice
                    </button>
                  </Link>
                  {client.phone && (
                    <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-xl hover:bg-green-500/20 transition-colors">
                        WhatsApp <ExternalLink className="w-3 h-3" />
                      </button>
                    </a>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {client.tags.map(t => <TagPill key={t} tag={t} onRemove={() => toggleTag(t)} />)}
                <div className="relative">
                  <button onClick={() => setShowTagDrop(!showTagDrop)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                    <Plus className="w-3 h-3" /> Add tag
                  </button>
                  <AnimatePresence>
                    {showTagDrop && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute left-0 top-8 z-20 bg-card border border-border rounded-xl shadow-xl py-1 w-40">
                        {PREDEFINED_TAGS.map(t => (
                          <button key={t} onClick={() => toggleTag(t)}
                            className={cn("w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10",
                              client.tags.includes(t) ? "text-primary font-medium" : "text-foreground")}>
                            <span className={cn("w-2 h-2 rounded-full", TAG_COLORS[t]?.split(" ")[0].replace("bg-opacity-20", "") || "bg-muted-foreground")} />
                            {t} {client.tags.includes(t) && "✓"}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                {[
                  { label: "Total Spent", value: `₹${client.totalSpent.toLocaleString("en-IN")}` },
                  { label: "Bookings", value: client.bookingsCount },
                  { label: "Member Since", value: formatDate(client.createdAt) },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Contact info editable */}
            <Section title="Contact Details" icon={Phone}>
              <div className="space-y-4">
                <EditableField label="Phone" value={client.phone || ""} onSave={v => saveField("phone", v)} />
                <EditableField label="Email" value={client.email || ""} onSave={v => saveField("email", v)} />
                <EditableField label="Address" value={client.address || ""} onSave={v => saveField("address", v)} />
                <EditableField label="Internal Notes" value={client.notes || ""} onSave={v => saveField("notes", v)} multiline />
              </div>
            </Section>

            {/* Niche custom fields */}
            {nicheFields.length > 0 && (
              <Section title={`${niche} Details`} icon={Tag}>
                <div className="grid grid-cols-2 gap-4">
                  {nicheFields.map(f => (
                    <EditableField key={f.key} label={f.label} value={client.customFields[f.key] || ""} onSave={v => saveCustomField(f.key, v)} />
                  ))}
                </div>
              </Section>
            )}

            {/* Timeline */}
            <Section title="Activity Timeline" icon={Clock}
              action={<span className="text-xs text-muted-foreground">{timeline.length} events</span>}>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {timeline.slice(0, timelineLimit).map((item, i) => {
                    if (item.type === "booking") {
                      const b = item.data as BookingItem;
                      const s = STATUS_BOOKING[b.status] || STATUS_BOOKING.pending;
                      return (
                        <TimelineItem key={`b-${b.id}`} icon={Calendar} iconBg="bg-primary/10 text-primary" date={item.date}>
                          <div className="bg-background border border-border/50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{b.title}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", s.bg, s.text)}>{b.status}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatDate(b.scheduledAt)}</span>
                              {b.amount && <span>₹{Number(b.amount).toLocaleString("en-IN")}</span>}
                              {b.duration && <span>{b.duration}m</span>}
                            </div>
                          </div>
                        </TimelineItem>
                      );
                    }
                    if (item.type === "invoice") {
                      const inv = item.data as InvoiceItem;
                      const s = STATUS_INVOICE[inv.status] || STATUS_INVOICE.draft;
                      return (
                        <TimelineItem key={`i-${inv.id}`} icon={FileText} iconBg="bg-teal-500/10 text-teal-400" date={item.date}>
                          <div className="bg-background border border-border/50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{inv.invoiceNumber}</span>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", s.bg, s.text)}>{inv.status}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>₹{Number(inv.total).toLocaleString("en-IN")}</span>
                              {inv.dueDate && <span>Due {formatDate(inv.dueDate)}</span>}
                            </div>
                          </div>
                        </TimelineItem>
                      );
                    }
                    const note = item.data as ClientNote;
                    return (
                      <TimelineItem key={`n-${note.id}`} icon={MessageSquare} iconBg="bg-amber-400/10 text-amber-400" date={item.date}>
                        <div className="bg-background border border-border/50 rounded-xl p-3 group relative">
                          <p className="text-sm text-foreground">{note.content}</p>
                          <button onClick={() => deleteNote(note.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TimelineItem>
                    );
                  })}
                  {timeline.length > timelineLimit && (
                    <button onClick={() => setTimelineLimit(l => l + 5)}
                      className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 transition-colors">
                      <ChevronDown className="w-4 h-4" /> Load more
                    </button>
                  )}
                </div>
              )}
            </Section>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-5">
            {/* At-risk alert */}
            {atRisk && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-orange-400">At-Risk Client</p>
                    <p className="text-xs text-orange-300/80 mt-1">
                      {client.lastBookingAt
                        ? `Last booked ${Math.floor((Date.now() - new Date(client.lastBookingAt).getTime()) / 86400000)} days ago. Consider reaching out.`
                        : "No bookings yet. Follow up to schedule their first session."
                      }
                    </p>
                    {client.phone && (
                      <a href={`https://wa.me/${client.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-orange-400 font-medium mt-2 hover:text-orange-300">
                        Message on WhatsApp <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI insight */}
            <Section title="AI Insights" icon={Sparkles}>
              {aiInsight ? (
                <div className="space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">{aiInsight}</p>
                  <button onClick={generateInsight} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Regenerate
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-3">Get AI-powered insights about this client's behaviour and value.</p>
                  <button onClick={generateInsight} disabled={aiLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 disabled:opacity-50 mx-auto transition-colors">
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {aiLoading ? "Generating…" : "Generate Insight"}
                  </button>
                </div>
              )}
            </Section>

            {/* Quick add note */}
            <Section title="Notes" icon={MessageSquare}
              action={<span className="text-xs text-muted-foreground">{client.clientNotes.length} notes</span>}>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    ref={noteRef}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addNote()}
                    placeholder="Add a note… (Enter to save)"
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <button onClick={addNote} disabled={addingNote || !noteText.trim()}
                    className="p-2 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors">
                    {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                {client.clientNotes.slice(0, 5).map(n => (
                  <div key={n.id} className="group bg-background border border-border/50 rounded-xl p-3 relative">
                    <p className="text-sm text-foreground pr-6">{n.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    <button onClick={() => deleteNote(n.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </Section>

            {/* Upcoming bookings */}
            {client.bookings.filter(b => new Date(b.scheduledAt) > new Date() && b.status !== "cancelled").length > 0 && (
              <Section title="Upcoming Bookings" icon={Calendar}>
                <div className="space-y-2">
                  {client.bookings
                    .filter(b => new Date(b.scheduledAt) > new Date() && b.status !== "cancelled")
                    .slice(0, 3)
                    .map(b => (
                      <div key={b.id} className="bg-background border border-border/50 rounded-xl p-3">
                        <p className="text-sm font-medium text-foreground">{b.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(b.scheduledAt)}</p>
                      </div>
                    ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
