import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, MapPin, Mail, Phone, Star, ChevronRight, Check,
  Calendar, Clock, X, Send, Instagram, Youtube, Link as LinkIcon,
  MessageCircle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Service  = { id: number; name: string; duration: string; price: number; description: string; showBookButton: boolean };
type Review   = { id: number; clientName: string; rating: number; comment: string | null; createdAt: string };
type Business = { id: number; name: string; category: string; phone: string | null; email: string | null; address: string | null; city: string | null; slug: string; logoUrl: string | null; description: string | null };
type Config   = {
  tagline: string | null; coverPhotoUrl: string | null; aboutText: string | null; showAbout: boolean;
  services: Service[]; showServices: boolean; showContact: boolean; showReviews: boolean;
  showBookingWidget: boolean; accentColor: string; socialInstagram: string | null;
  socialFacebook: string | null; socialYoutube: string | null; whatsappEnabled: boolean;
  mapsLink: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function Stars({ rating, size = 4, interactive = false, onSelect }: { rating: number; size?: number; interactive?: boolean; onSelect?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" disabled={!interactive}
          onClick={() => onSelect?.(i)} onMouseEnter={() => interactive && setHover(i)} onMouseLeave={() => setHover(0)}
          className={cn("transition-transform", interactive && "hover:scale-110")}>
          <Star className={cn(`w-${size} h-${size}`, (interactive ? hover || rating : rating) >= i ? "fill-amber-400 text-amber-400" : "fill-muted/30 text-muted/30")} />
        </button>
      ))}
    </div>
  );
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h > 12 ? h - 12 : h || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Booking Widget ─────────────────────────────────────────────────────────────

function BookingWidget({ slug, services, accent }: { slug: string; services: Service[]; accent: string }) {
  const [step, setStep]       = useState(1); // 1=service 2=datetime 3=contact 4=done
  const [service, setSvc]     = useState<Service | null>(null);
  const [date, setDate]       = useState("");
  const [time, setTime]       = useState("");
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [notes, setNotes]     = useState("");
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState("");

  const today = new Date().toISOString().split("T")[0];

  const submit = async () => {
    if (!name.trim() || !date || !time) { setError("Please fill in all required fields."); return; }
    setError(""); setSub(true);
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const res = await fetch(`/api/public-page/public/${slug}/book`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: name, clientPhone: phone, serviceName: service?.name, servicePrice: service?.price, scheduledAt, notes }),
    });
    setSub(false);
    if (res.ok) { setStep(4); }
    else { setError("Booking failed. Please try again."); }
  };

  const accentStyle = { background: accent };
  const accentText  = { color: accent };
  const accentBorder = { borderColor: `${accent}40` };

  if (step === 4) return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={accentStyle}>
        <Check className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Booking Confirmed! 🎉</h3>
      <p className="text-muted-foreground text-sm">The business will get in touch with you shortly to confirm your appointment.</p>
      {service && <p className="text-sm font-medium mt-3" style={accentText}>{service.name} · {date} at {fmtTime(time)}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-2">
        {["Service", "Date & Time", "Your Details"].map((label, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-1">
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
              step > i + 1 ? "text-white" : step === i + 1 ? "text-white" : "bg-muted/30 text-muted-foreground")}
              style={step >= i + 1 ? accentStyle : {}}>
              {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={cn("text-xs hidden sm:block", step === i + 1 ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
            {i < 2 && <div className="flex-1 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Service */}
      {step === 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground mb-2">Choose a service</p>
          {services.filter(s => s.showBookButton).map(s => (
            <button key={s.id} onClick={() => { setSvc(s); setStep(2); }}
              className={cn("w-full text-left p-3 rounded-xl border transition-all hover:border-opacity-80", service?.id === s.id ? "border-2" : "border")}
              style={service?.id === s.id ? { borderColor: accent, background: `${accent}10` } : { borderColor: "#ffffff20" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.duration} · ₹{s.price.toLocaleString("en-IN")}</p>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))}
          <button onClick={() => { setSvc(null); setStep(2); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">
            Skip — choose service later
          </button>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Pick a Date</label>
            <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 [color-scheme:dark]"
              style={{ "--ring-color": accent } as any} />
          </div>
          {date && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Pick a Time</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={() => setTime(t)}
                    className={cn("py-2 px-2 rounded-xl text-xs font-medium border transition-all", time === t ? "text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground hover:border-opacity-60")}
                    style={time === t ? accentStyle : {}}>
                    {fmtTime(t)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Back</button>
            <button onClick={() => { if (date && time) setStep(3); }} disabled={!date || !time}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={accentStyle}>Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 3 && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Your Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything you'd like the business to know…"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none resize-none" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {/* Summary */}
          <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: `${accent}10`, border: `1px solid ${accent}30` }}>
            {service && <p><span className="text-muted-foreground">Service:</span> <strong>{service.name}</strong> (₹{service.price.toLocaleString("en-IN")})</p>}
            <p><span className="text-muted-foreground">Date:</span> <strong>{new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</strong></p>
            <p><span className="text-muted-foreground">Time:</span> <strong>{fmtTime(time)}</strong></p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Back</button>
            <button onClick={submit} disabled={submitting || !name.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={accentStyle}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Review Form ────────────────────────────────────────────────────────────────

function ReviewForm({ slug, accent, onSubmit }: { slug: string; accent: string; onSubmit: (r: Review) => void }) {
  const [name, setName]       = useState("");
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSub]  = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    setError(""); setSub(true);
    const res = await fetch(`/api/public-page/public/${slug}/review`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientName: name, rating, comment }),
    });
    setSub(false);
    if (res.ok) { const d = await res.json(); onSubmit(d.review); setDone(true); }
    else { setError("Failed to submit review. Please try again."); }
  };

  if (done) return (
    <div className="text-center py-4">
      <Check className="w-8 h-8 mx-auto mb-2" style={{ color: accent }} />
      <p className="font-medium text-foreground">Thank you for your review!</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Your Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Rating *</label>
        <Stars rating={rating} size={6} interactive onSelect={setRating} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Comment</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Share your experience…"
          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none resize-none" />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={submitting}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: accent }}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Review
      </button>
    </form>
  );
}

// ── Nav Link ───────────────────────────────────────────────────────────────────

function NavLink({ href, children, accent }: { href: string; children: React.ReactNode; accent: string }) {
  return (
    <a href={href} onClick={e => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: "smooth" }); }}
      className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: `${accent}cc` }}>
      {children}
    </a>
  );
}

// ── Main Public Page ───────────────────────────────────────────────────────────

export function PublicPage() {
  const [, params]                = useRoute("/p/:slug");
  const slug                      = params?.slug || "";
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [business, setBiz]        = useState<Business | null>(null);
  const [config, setConfig]       = useState<Config | null>(null);
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [showReviewForm, setSRF]  = useState(false);
  const [showBooking, setSB]      = useState(false);
  const [bookingService, setBS]   = useState<Service | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/public-page/public/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null; } return r.json(); })
      .then(d => {
        if (!d) return;
        setBiz(d.business); setConfig(d.config); setReviews(d.reviews || []);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "#7c3aed" }} />
      <p className="text-white/50 text-sm">Loading profile…</p>
    </div>
  );

  if (notFound || !business || !config) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <MapPin className="w-8 h-8 text-white/30" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-white/50">This business page doesn't exist or isn't published yet.</p>
    </div>
  );

  const accent = config.accentColor || "#7c3aed";
  const services = (config.services as Service[]) || [];
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;
  const whatsappUrl = business.phone ? `https://wa.me/91${business.phone.replace(/\D/g, "").slice(-10)}` : null;

  const navItems = [
    config.showAbout && config.aboutText && { label: "About", href: "#about" },
    config.showServices && services.length > 0 && { label: "Services", href: "#services" },
    config.showBookingWidget && { label: "Book", href: "#book" },
    config.showContact && { label: "Contact", href: "#contact" },
    config.showReviews && { label: "Reviews", href: "#reviews" },
  ].filter(Boolean) as { label: string; href: string }[];

  const openBooking = (svc?: Service) => { setBS(svc || null); setSB(true); };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Cover & Hero ── */}
      <div className="relative">
        {/* Cover photo */}
        <div className="h-56 sm:h-72 relative overflow-hidden"
          style={config.coverPhotoUrl ? { backgroundImage: `url(${config.coverPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 50%, #0a0a0f 100%)` }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(10,10,15,0.95) 100%)" }} />
          {/* Nav */}
          {navItems.length > 0 && (
            <div className="absolute top-0 left-0 right-0 flex justify-center gap-6 pt-4 px-4 z-10">
              {navItems.map(n => <NavLink key={n.href} href={n.href} accent={accent}>{n.label}</NavLink>)}
            </div>
          )}
        </div>

        {/* Identity overlay */}
        <div className="relative z-10 -mt-16 px-4 sm:px-8 max-w-3xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#0a0a0f] flex items-center justify-center text-3xl font-extrabold shrink-0 shadow-2xl"
              style={{ background: accent }}>
              {business.name.charAt(0).toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">{business.name}</h1>
              {config.tagline && <p className="text-sm sm:text-base mt-1" style={{ color: `${accent}cc` }}>{config.tagline}</p>}
              {business.city && <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{business.city}</p>}
            </div>
          </div>

          {/* Rating + Quick actions */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            {avgRating && (
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold">{avgRating}</span>
                <span className="text-xs text-white/40">({reviews.length})</span>
              </div>
            )}
            {config.showBookingWidget && (
              <button onClick={() => openBooking()}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                style={{ background: accent }}>
                <Calendar className="w-4 h-4" /> Book Now
              </button>
            )}
            {whatsappUrl && config.whatsappEnabled && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-[#25d366] shadow-lg transition-all hover:opacity-90">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
          </div>

          {/* Accent divider */}
          <div className="h-px mt-6 rounded-full opacity-30" style={{ background: accent }} />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pb-24 space-y-12 mt-8">

        {/* ── About ── */}
        {config.showAbout && config.aboutText && (
          <section id="about">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>About</h2>
            <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{config.aboutText}</p>
          </section>
        )}

        {/* ── Services ── */}
        {config.showServices && services.length > 0 && (
          <section id="services">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map(s => (
                <div key={s.id} className="rounded-2xl p-4 border transition-all hover:scale-[1.01]"
                  style={{ background: `${accent}0d`, borderColor: `${accent}30` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration}</span>
                        <span className="text-sm font-bold" style={{ color: accent }}>₹{s.price.toLocaleString("en-IN")}</span>
                      </div>
                      {s.description && <p className="text-xs text-white/50 mt-1.5 leading-relaxed">{s.description}</p>}
                    </div>
                    {s.showBookButton && (
                      <button onClick={() => openBooking(s)}
                        className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: accent }}>
                        Book
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Booking Widget (inline) ── */}
        {config.showBookingWidget && (
          <section id="book">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>Book an Appointment</h2>
            <div className="rounded-2xl p-5 border" style={{ background: `${accent}0d`, borderColor: `${accent}30` }}>
              <BookingWidget slug={slug} services={services.filter(s => s.showBookButton)} accent={accent} />
            </div>
          </section>
        )}

        {/* ── Contact ── */}
        {config.showContact && (business.phone || business.email || business.address) && (
          <section id="contact">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>Contact</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {business.phone && (
                <a href={`tel:${business.phone}`}
                  className="flex items-center gap-3 rounded-2xl p-4 border transition-all hover:opacity-80"
                  style={{ background: `${accent}0d`, borderColor: `${accent}30` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: accent }}>
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div><p className="text-xs text-white/50">Phone</p><p className="font-medium text-white text-sm">{business.phone}</p></div>
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`}
                  className="flex items-center gap-3 rounded-2xl p-4 border transition-all hover:opacity-80"
                  style={{ background: `${accent}0d`, borderColor: `${accent}30` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: accent }}>
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div><p className="text-xs text-white/50">Email</p><p className="font-medium text-white text-sm">{business.email}</p></div>
                </a>
              )}
              {(business.address || business.city) && (
                <a href={config.mapsLink || "#"} target={config.mapsLink ? "_blank" : "_self"} rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-4 border transition-all hover:opacity-80 sm:col-span-2"
                  style={{ background: `${accent}0d`, borderColor: `${accent}30` }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: accent }}>
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div><p className="text-xs text-white/50">Address</p><p className="font-medium text-white text-sm">{[business.address, business.city].filter(Boolean).join(", ")}</p></div>
                </a>
              )}
            </div>

            {/* WhatsApp + Social */}
            <div className="mt-3 flex flex-wrap gap-2">
              {whatsappUrl && config.whatsappEnabled && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#25d366] hover:opacity-90 transition-all">
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </a>
              )}
              {config.socialInstagram && (
                <a href={`https://${config.socialInstagram}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {config.socialFacebook && (
                <a href={`https://${config.socialFacebook}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                  <LinkIcon className="w-4 h-4" /> Facebook
                </a>
              )}
              {config.socialYoutube && (
                <a href={`https://${config.socialYoutube}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all">
                  <Youtube className="w-4 h-4" /> YouTube
                </a>
              )}
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        {config.showReviews && (
          <section id="reviews">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Reviews</h2>
                {avgRating && (
                  <div className="flex items-center gap-2 mt-1">
                    <Stars rating={Math.round(Number(avgRating))} size={4} />
                    <span className="text-white font-bold">{avgRating}</span>
                    <span className="text-white/40 text-xs">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
              <button onClick={() => setSRF(!showReviewForm)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: `${accent}30`, border: `1px solid ${accent}50` }}>
                <Star className="w-3.5 h-3.5" /> Leave a Review
              </button>
            </div>

            {/* Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-4 rounded-2xl border p-4" style={{ borderColor: `${accent}30`, background: `${accent}0d` }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-white text-sm">Share your experience</p>
                    <button onClick={() => setSRF(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                  <ReviewForm slug={slug} accent={accent} onSubmit={r => { setReviews(prev => [r as any, ...prev]); setTimeout(() => setSRF(false), 1500); }} />
                </motion.div>
              )}
            </AnimatePresence>

            {reviews.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-white/10">
                <p className="text-white/40 text-sm">No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="rounded-2xl p-4 border" style={{ background: `${accent}0d`, borderColor: `${accent}20` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: accent }}>
                            {r.clientName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-white text-sm">{r.clientName}</span>
                        </div>
                        <Stars rating={r.rating} size={3} />
                        {r.comment && <p className="text-white/60 text-sm mt-2 leading-relaxed">{r.comment}</p>}
                      </div>
                      <span className="text-white/30 text-xs shrink-0">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 text-center">
        <a href="/" className="text-white/20 text-xs hover:text-white/40 transition-colors flex items-center gap-1.5 justify-center">
          <Zap className="w-3 h-3" /> Powered by NicheFlow
        </a>
      </footer>

      {/* ── Booking Modal ── */}
      <AnimatePresence>
        {showBooking && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSB(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
              style={{ background: "#111117", border: `1px solid ${accent}30` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Book Appointment</h3>
                <button onClick={() => setSB(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              {bookingService && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                  <p className="text-sm font-semibold text-white">{bookingService.name}</p>
                  <p className="text-xs text-white/50">{bookingService.duration} · ₹{bookingService.price.toLocaleString("en-IN")}</p>
                </div>
              )}
              <BookingWidget slug={slug} services={services.filter(s => s.showBookButton)} accent={accent} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

