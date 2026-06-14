import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, List, ChevronLeft, ChevronRight, X, Search,
  Clock, User, FileText, Trash2, Edit2, CheckCircle2, AlertCircle,
  XCircle, MoreHorizontal, Loader2, ExternalLink,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetBookings, useCreateBooking, useGetClients, useCreateClient } from "@/hooks/data";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// ── types ─────────────────────────────────────────────────────────────────────

type Booking = {
  id: number; clientId: number | null; clientName: string | null;
  title: string; description: string | null; status: string;
  scheduledAt: string; duration: number | null; amount: number | null;
  notes: string | null; createdAt: string;
};

type ViewMode = "month" | "week" | "list";

// ── constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: "Pending",   bg: "bg-amber-400/15",     text: "text-amber-400",     dot: "bg-amber-400" },
  confirmed: { label: "Confirmed", bg: "bg-primary/15",       text: "text-primary",       dot: "bg-primary" },
  completed: { label: "Completed", bg: "bg-teal-500/15",      text: "text-teal-400",      dot: "bg-teal-400" },
  cancelled: { label: "Cancelled", bg: "bg-muted/40",         text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hr",   value: 60 },
  { label: "1.5 hr", value: 90 },
  { label: "2 hr",   value: 120 },
  { label: "3 hr",   value: 180 },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am–7pm

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function authHeader() {
  return { Authorization: `Bearer ${localStorage.getItem("nf_token")}`, "Content-Type": "application/json" };
}

// ── status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function Sk({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-border/60", className)} />;
}

// ── slide-in overlay ──────────────────────────────────────────────────────────

function SlideIn({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">{title}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── new booking form ──────────────────────────────────────────────────────────

function NewBookingPanel({
  open, onClose, clients, initialDate, services, onSuccess,
}: {
  open: boolean; onClose: () => void;
  clients: any[]; initialDate?: Date; services: string[]; onSuccess: () => void;
}) {
  const { mutate: createBooking, isPending } = useCreateBooking();
  const { mutate: createClient, isPending: creatingClient } = useCreateClient();
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [error, setError] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const defaultDate = initialDate
    ? `${initialDate.getFullYear()}-${String(initialDate.getMonth()+1).padStart(2,"0")}-${String(initialDate.getDate()).padStart(2,"0")}T09:00`
    : "";

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  const handleAddClient = () => {
    if (!newClientName.trim()) return;
    createClient({ data: { name: newClientName.trim() } }, {
      onSuccess: () => { setShowNewClient(false); setNewClientName(""); onSuccess(); },
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const scheduledAt = fd.get("scheduledAt") as string;
    if (!title || !scheduledAt) { setError("Title and date/time are required."); return; }

    createBooking({
      data: {
        title,
        clientId: fd.get("clientId") ? Number(fd.get("clientId")) : undefined,
        scheduledAt,
        status: fd.get("status") as any || "pending",
        duration: fd.get("duration") ? Number(fd.get("duration")) : undefined,
        amount: fd.get("amount") ? Number(fd.get("amount")) : undefined,
        notes: fd.get("notes") as string || undefined,
      },
    }, {
      onSuccess: () => { onSuccess(); onClose(); },
      onError: () => setError("Failed to create booking. Try again."),
    });
  };

  return (
    <SlideIn open={open} onClose={onClose} title="New Booking">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Service / title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Service / Title *</label>
          {services.length > 0 ? (
            <select name="title" required className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Select or type below…</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="__custom">Custom…</option>
            </select>
          ) : (
            <input name="title" required placeholder="e.g. Training Session" className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          )}
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Client</label>
          {!showNewClient ? (
            <div className="space-y-2">
              <input
                value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                placeholder="Search clients…"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <select name="clientId" className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                <option value="">No client</option>
                {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewClient(true)} className="text-xs text-primary hover:text-primary/80 transition-colors">
                + Add new client
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={newClientName} onChange={e => setNewClientName(e.target.value)}
                placeholder="Client name"
                className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button type="button" onClick={handleAddClient} disabled={creatingClient}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium disabled:opacity-50">
                {creatingClient ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
              </button>
              <button type="button" onClick={() => setShowNewClient(false)} className="px-3 py-2 text-xs text-muted-foreground">Cancel</button>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date & Time *</label>
            <input
              type="datetime-local" name="scheduledAt" required
              defaultValue={defaultDate}
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Duration</label>
            <select name="duration" className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Amount & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Amount (₹)</label>
            <input type="number" name="amount" placeholder="0" step="0.01"
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
            <select name="status" className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
          <textarea name="notes" rows={3} placeholder="Any special notes…"
            className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Booking
          </button>
        </div>
      </form>
    </SlideIn>
  );
}

// ── booking detail panel ──────────────────────────────────────────────────────

function BookingDetail({
  booking, open, onClose, onStatusChange, onDelete, onEdit,
}: {
  booking: Booking | null; open: boolean; onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onEdit: (booking: Booking) => void;
}) {
  if (!booking) return null;
  const statusOrder = ["pending", "confirmed", "completed", "cancelled"];

  return (
    <SlideIn open={open} onClose={onClose} title="Booking Details">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={booking.status} />
            {booking.amount && (
              <span className="text-sm font-semibold text-foreground">₹{Number(booking.amount).toLocaleString("en-IN")}</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground">{booking.title}</h3>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-foreground">{formatDate(booking.scheduledAt)} at {formatTime(booking.scheduledAt)}</span>
          </div>
          {booking.duration && (
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-foreground">{booking.duration} minutes</span>
            </div>
          )}
          {booking.clientName && (
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 bg-background border border-border rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-foreground font-medium">{booking.clientName}</span>
                <Link href="/clients">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {booking.notes && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
            <p className="text-sm text-foreground bg-background border border-border rounded-xl p-3 leading-relaxed">{booking.notes}</p>
          </div>
        )}

        {/* Reminder badge */}
        <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-400">Reminder pending — 24h before session</span>
        </div>

        {/* Status change */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Change Status</p>
          <div className="grid grid-cols-2 gap-2">
            {statusOrder.map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(booking.id, s)}
                  disabled={booking.status === s}
                  className={cn(
                    "py-2 rounded-xl text-xs font-medium transition-all border",
                    booking.status === s
                      ? cn(cfg.bg, cfg.text, "border-current/30 cursor-default")
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href="/invoices" className="flex-1">
            <button className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 flex items-center justify-center gap-2 transition-colors">
              <FileText className="w-4 h-4" /> Generate Invoice
            </button>
          </Link>
          <button
            onClick={() => onEdit(booking)}
            className="py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { onDelete(booking.id); onClose(); }}
            className="py-2.5 px-4 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </SlideIn>
  );
}

// ── month calendar ────────────────────────────────────────────────────────────

function MonthCalendar({ bookings, currentDate, onDayClick, onBookingClick }: {
  bookings: Booking[]; currentDate: Date;
  onDayClick: (date: Date) => void; onBookingClick: (b: Booking) => void;
}) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
    return new Date(year, month, dayNum);
  });

  const bookingsForDay = (day: Date) =>
    bookings.filter(b => isSameDay(new Date(b.scheduledAt), day));

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map(d => (
          <div key={d} className="py-3 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-[96px] border-b border-r border-border/40 bg-background/20" />;
          const isToday = isSameDay(day, today);
          const dayBookings = bookingsForDay(day);
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[96px] border-b border-r border-border/40 p-1.5 cursor-pointer hover:bg-white/5 transition-colors",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-sm mb-1 font-medium",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground"
              )}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {dayBookings.slice(0, 3).map(b => {
                  const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                  return (
                    <div
                      key={b.id}
                      onClick={e => { e.stopPropagation(); onBookingClick(b); }}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80",
                        cfg.bg, cfg.text
                      )}
                    >
                      {formatTime(b.scheduledAt)} {b.title}
                    </div>
                  );
                })}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{dayBookings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── week view ─────────────────────────────────────────────────────────────────

function WeekView({ bookings, currentDate, onBookingClick, onSlotClick }: {
  bookings: Booking[]; currentDate: Date;
  onBookingClick: (b: Booking) => void; onSlotClick: (date: Date) => void;
}) {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const today = new Date();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b border-border min-w-[600px]">
        <div className="py-3 text-center text-xs text-muted-foreground border-r border-border" />
        {weekDays.map((d, i) => (
          <div key={i} className={cn("py-3 text-center", i < 6 && "border-r border-border")}>
            <p className="text-xs text-muted-foreground">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}</p>
            <p className={cn("text-sm font-semibold mt-0.5", isSameDay(d, today) ? "text-primary" : "text-foreground")}>
              {d.getDate()}
            </p>
          </div>
        ))}
      </div>
      {/* Time rows */}
      <div className="min-w-[600px] max-h-[520px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-8 border-b border-border/50" style={{ minHeight: 52 }}>
            <div className="border-r border-border px-2 py-1 text-[10px] text-muted-foreground sticky left-0 bg-card">
              {hour === 12 ? "12 PM" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
            </div>
            {weekDays.map((day, di) => {
              const slotBookings = bookings.filter(b => {
                const bd = new Date(b.scheduledAt);
                return isSameDay(bd, day) && bd.getHours() === hour;
              });
              return (
                <div
                  key={di}
                  onClick={() => { const d = new Date(day); d.setHours(hour, 0); onSlotClick(d); }}
                  className={cn("border-r border-border/50 last:border-r-0 p-0.5 cursor-pointer hover:bg-white/5 transition-colors", di === 6 && "border-r-0")}
                >
                  {slotBookings.map(b => {
                    const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;
                    return (
                      <div
                        key={b.id}
                        onClick={e => { e.stopPropagation(); onBookingClick(b); }}
                        className={cn("text-[10px] px-1.5 py-1 rounded font-medium truncate cursor-pointer hover:opacity-80", cfg.bg, cfg.text)}
                      >
                        {b.title}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── list view ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function ListView({ bookings, isLoading, onBookingClick, onStatusChange, onDelete }: {
  bookings: Booking[]; isLoading: boolean;
  onBookingClick: (b: Booking) => void;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}) {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [sort, setSort]             = useState<"date" | "client" | "amount">("date");
  const [page, setPage]             = useState(1);
  const [openMenu, setOpenMenu]     = useState<number | null>(null);

  const filtered = useMemo(() => {
    let b = [...bookings];
    if (search) b = b.filter(x => x.title.toLowerCase().includes(search.toLowerCase()) || x.clientName?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") b = b.filter(x => x.status === statusFilter);
    if (sort === "date")   b.sort((a, z) => new Date(a.scheduledAt).getTime() - new Date(z.scheduledAt).getTime());
    if (sort === "client") b.sort((a, z) => (a.clientName || "").localeCompare(z.clientName || ""));
    if (sort === "amount") b.sort((a, z) => (z.amount || 0) - (a.amount || 0));
    return b;
  }, [bookings, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Sk key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search bookings…"
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
        <select
          value={sort} onChange={e => setSort(e.target.value as any)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="date">Sort: Date</option>
          <option value="client">Sort: Client</option>
          <option value="amount">Sort: Amount</option>
        </select>
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card border border-border rounded-2xl text-muted-foreground">
          <Calendar className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Service", "Client", "Date & Time", "Duration", "Amount", "Status", ""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(b => (
                <tr
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className="border-b border-border/50 last:border-b-0 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-medium text-foreground max-w-[160px] truncate">{b.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{b.clientName || "—"}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(b.scheduledAt)}<br />
                    <span className="text-xs">{formatTime(b.scheduledAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{b.duration ? `${b.duration}m` : "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{b.amount ? `₹${Number(b.amount).toLocaleString("en-IN")}` : "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenu(openMenu === b.id ? null : b.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenu === b.id && (
                      <div className="absolute right-4 top-10 z-20 bg-card border border-border rounded-xl shadow-xl py-1 w-40">
                        {["confirmed","completed","cancelled"].filter(s => s !== b.status).map(s => (
                          <button key={s} onClick={() => { onStatusChange(b.id, s); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-white/10 flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", STATUS_CONFIG[s].dot)} />
                            Mark {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        <div className="border-t border-border my-1" />
                        <button onClick={() => { onDelete(b.id); setOpenMenu(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} bookings</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function Bookings() {
  const qc = useQueryClient();
  const { data: bookings = [], isLoading } = useGetBookings() as { data: Booking[]; isLoading: boolean };
  const { data: clients = [] } = useGetClients() as { data: any[]; isLoading: boolean };

  const [view, setView]             = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNew, setShowNew]       = useState(false);
  const [initialDate, setInitialDate] = useState<Date | undefined>();
  const [selectedBooking, setSelected] = useState<Booking | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [workspace, setWorkspace]   = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("nf_token");
    fetch("/api/onboarding/config", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setWorkspace).catch(() => {});
  }, []);

  const terminology = workspace?.terminology || {};
  const services: string[] = workspace?.services || terminology.services || [];
  const pageTitle = terminology.bookings || "Bookings";

  const refetch = () => qc.invalidateQueries({ queryKey: ["/api/bookings"] });

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`/api/bookings/${id}/status`, {
      method: "PATCH", headers: authHeader(), body: JSON.stringify({ status }),
    });
    refetch();
    if (selectedBooking?.id === id) setSelected(prev => prev ? { ...prev, status } : prev);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this booking?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE", headers: authHeader() });
    refetch();
    setShowDetail(false);
  };

  const handleDayClick = (date: Date) => { setInitialDate(date); setShowNew(true); };
  const handleBookingClick = (b: Booking) => { setSelected(b); setShowDetail(true); };

  // Month navigation
  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const periodLabel = view === "month"
    ? currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : `Week of ${currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isLoading ? "Loading…" : `${(bookings as Booking[]).length} total`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex items-center bg-card border border-border rounded-xl p-1 gap-1">
              {([["month", Calendar], ["week", Calendar], ["list", List]] as [ViewMode, any][]).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                    view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {v}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setInitialDate(undefined); setShowNew(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" /> New {pageTitle.replace(/s$/, "")}
            </button>
          </div>
        </div>

        {/* ── Calendar navigation ── */}
        {view !== "list" && (
          <div className="flex items-center gap-3">
            <button onClick={prevPeriod} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-foreground min-w-[180px] text-center">{periodLabel}</span>
            <button onClick={nextPeriod} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="text-xs text-primary hover:text-primary/80 ml-2 transition-colors">Today</button>
          </div>
        )}

        {/* ── Content ── */}
        {view === "month" && (
          <MonthCalendar
            bookings={bookings as Booking[]}
            currentDate={currentDate}
            onDayClick={handleDayClick}
            onBookingClick={handleBookingClick}
          />
        )}
        {view === "week" && (
          <WeekView
            bookings={bookings as Booking[]}
            currentDate={currentDate}
            onBookingClick={handleBookingClick}
            onSlotClick={handleDayClick}
          />
        )}
        {view === "list" && (
          <ListView
            bookings={bookings as Booking[]}
            isLoading={isLoading}
            onBookingClick={handleBookingClick}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}

        {/* Empty state for calendar views */}
        {!isLoading && view !== "list" && (bookings as Booking[]).length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-2xl text-muted-foreground mt-4">
            <Calendar className="w-14 h-14 mb-4 opacity-30" />
            <p className="text-sm font-medium mb-2">No {pageTitle.toLowerCase()} yet</p>
            <button
              onClick={() => setShowNew(true)}
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              Add your first one <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Panels ── */}
      <NewBookingPanel
        open={showNew}
        onClose={() => setShowNew(false)}
        clients={clients}
        initialDate={initialDate}
        services={services}
        onSuccess={refetch}
      />
      <BookingDetail
        booking={selectedBooking}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onEdit={() => {}}
      />
    </AppLayout>
  );
}
