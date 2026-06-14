# NicheFlow — Agentic MVP: Complete System Blueprint

> *An AI-powered, fully agentic business operating system for niche small businesses in India.*
> *Every feature thinks, acts, and learns on your behalf.*

---

## Table of Contents

1. [Vision & Positioning](#1-vision--positioning)
2. [Design System & Color Palette](#2-design-system--color-palette)
3. [UX Philosophy & Framer Motion Scroll Architecture](#3-ux-philosophy--framer-motion-scroll-architecture)
4. [Agentic Feature Map — Full Module Breakdown](#4-agentic-feature-map--full-module-breakdown)
5. [Infrastructure Layers](#5-infrastructure-layers)
6. [Full Technology Stack](#6-full-technology-stack)
7. [Database Schema Overview](#7-database-schema-overview)
8. [Agent Architecture & Orchestration](#8-agent-architecture--orchestration)
9. [Security, Auth & Permissions](#9-security-auth--permissions)
10. [CI/CD & DevOps Pipeline](#10-cicd--devops-pipeline)
11. [Error Tracking, Observability & Recovery](#11-error-tracking-observability--recovery)
12. [MVP Scoping & Launch Roadmap](#12-mvp-scoping--launch-roadmap)

---

## 1. Vision & Positioning

### What NicheFlow Is

NicheFlow is not a CRM. It is not a booking app. It is a **living business brain** — an agentic operating system where AI agents handle the repetitive cognitive load of running a small business, so the owner can focus on the craft.

**Target Personas:**
| Persona | Pain Point | NicheFlow Solves |
|---|---|---|
| Dog Trainer (Pune) | Forgets follow-ups, no invoice system | Auto-follow-up agent, one-tap invoice |
| Tailor (Surat) | WhatsApp chaos, no measurement records | Client profile agent, measurement vault |
| Photographer (Mumbai) | Manual contracts, late payments | Contract agent, auto-payment reminders |
| Urban Farmer (Bengaluru) | Inventory guesswork, perishable waste | Inventory forecast agent, waste alerts |
| Yoga Studio (Delhi) | Class scheduling chaos | Booking agent, waitlist automation |

### What "Agentic" Means Here

Every module contains a **local agent** that:
- **Observes** state changes in its domain
- **Reasons** using context (business type, history, time of day, language preference)
- **Acts** autonomously within pre-approved boundaries
- **Explains** every action taken in a plain-language audit trail
- **Learns** from user overrides and feedback loops

Agents communicate through a **central orchestrator** (NicheFlow Brain) that resolves conflicts and prioritizes tasks across modules.

---

## 2. Design System & Color Palette

### Aesthetic Direction

**Mood:** Warm-digital. The confidence of a modern SaaS with the warmth of a bazaar. Not sterile. Not loud. *Grounded and intelligent.*

**Reference:** Think Notion meets Zepto meets a well-designed chai stall menu. Clean structure, rich earth tones, moments of glowing AI presence.

**Audience Spectrum:**
- 19–28 year olds: tech-literate, want speed and cool factor
- 35–55 year olds: need clarity, trust signals, language options
- Both: mobile-first, want things to just *work*

---

### Color Palette

```
NICHEFLOW DESIGN TOKENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BRAND CORE
  --nf-saffron:        #F97316   (CTA, agent highlights, energy)
  --nf-saffron-light:  #FED7AA   (hover states, warm backgrounds)
  --nf-ink:            #1C1917   (primary text, headings)
  --nf-clay:           #44403C   (secondary text, labels)

SURFACE SYSTEM
  --nf-base:           #FAFAF9   (page background)
  --nf-surface:        #FFFFFF   (cards, panels)
  --nf-surface-warm:   #FEF3C7   (AI action cards, agent panels)
  --nf-border:         #E7E5E4   (dividers, card borders)

AI / AGENTIC LAYER
  --nf-agent-glow:     #7C3AED   (agent status, AI thinking pulse)
  --nf-agent-light:    #EDE9FE   (agent suggestion backgrounds)
  --nf-agent-success:  #059669   (agent action completed)
  --nf-agent-warn:     #D97706   (agent needs attention)

SEMANTIC
  --nf-success:        #10B981
  --nf-error:          #EF4444
  --nf-warning:        #F59E0B
  --nf-info:           #3B82F6

HINDI / REGIONAL MODE (warmer shift)
  --nf-hindi-accent:   #B45309   (deeper saffron for regional UI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Typography

```
TYPEFACES
  Display:  "Fraunces" (serif, variable — used for hero headlines & numbers)
  Body:     "Inter" (neutral, legible — used for all UI copy)
  Data:     "JetBrains Mono" (for invoice numbers, IDs, code)
  Regional: "Noto Sans Devanagari" (Hindi/regional mode)

TYPE SCALE (rem)
  --text-xs:    0.75rem
  --text-sm:    0.875rem
  --text-base:  1rem
  --text-lg:    1.125rem
  --text-xl:    1.25rem
  --text-2xl:   1.5rem
  --text-3xl:   1.875rem
  --text-4xl:   2.25rem
  --text-display: clamp(2.5rem, 6vw, 4.5rem)
```

### Spacing & Radius

```
SPACING (4px base)
  --space-1: 4px   --space-2: 8px   --space-3: 12px
  --space-4: 16px  --space-6: 24px  --space-8: 32px
  --space-12: 48px --space-16: 64px --space-24: 96px

BORDER RADIUS
  --radius-sm: 6px    (inputs, small chips)
  --radius-md: 12px   (cards, panels)
  --radius-lg: 20px   (modals, floating elements)
  --radius-xl: 32px   (agent assistant bubble)
  --radius-full: 9999px (badges, avatars, pills)
```

---

## 3. UX Philosophy & Framer Motion Scroll Architecture

### Core UX Principles

1. **Zero to running in 5 minutes** — Onboarding wizard auto-configures agents based on business type
2. **Proactive over reactive** — Agents surface action cards before you need them
3. **Every screen has a "Simple Mode"** — Toggle collapses to a wizard for overwhelming sections
4. **Language fluidity** — Switch EN ↔ HI mid-session without data loss
5. **Ambient intelligence** — Agent activity visible but not intrusive (floating status ring)
6. **Touch-first, keyboard-friendly** — Bottom nav on mobile, ⌘K on desktop
7. **Graceful offline** — Service worker caches last session state

---

### Framer Motion Scroll Architecture

> Use Framer Motion's `useScroll`, `useTransform`, `useSpring`, and `AnimatePresence` as the animation backbone.

#### Landing / Marketing Page Scroll Layers

```
SECTION 1: HERO
─────────────────────────────────────────────────
Layout: Full viewport height, centered
Entry:  Page load → staggered word-by-word headline reveal
        (motion.span with staggerChildren: 0.08s)
BG:     Parallax mesh gradient — saffron to violet via useScroll + useTransform
        y: [0, 1] → translateY: ['0%', '-15%']
Agent:  Floating orb (--nf-agent-glow, blur:40px) drifts with scrollYProgress
CTA:    Scale spring on hover (spring: { stiffness: 400, damping: 17 })

SECTION 2: WHAT AGENTS DO (scroll-triggered cards)
─────────────────────────────────────────────────
Layout: Sticky left label + right scrolling cards
Motion: As user scrolls, cards fan in from right (x: 80 → 0, opacity: 0→1)
        Each card has a stagger of 0.15s
Agent icon pulses with a looping scale animation (1.0 → 1.08 → 1.0, 2s loop)

SECTION 3: BUSINESS TYPE SELECTOR (interactive)
─────────────────────────────────────────────────
Layout: Horizontal scroll snap row of persona cards
Motion: Selected card expands with layoutId animation (shared layout)
        Dashboard preview morphs in below with AnimatePresence exit/enter

SECTION 4: FEATURE MODULES GRID
─────────────────────────────────────────────────
Motion: whileInView with viewport: { once: true, margin: "-100px" }
        Cards rise from y:40 with staggerChildren
        Hover: subtle rotateX(4deg) + translateY(-4px) with perspective

SECTION 5: TESTIMONIALS (TICKER)
─────────────────────────────────────────────────
Motion: Infinite horizontal marquee via animate: { x: [0, -100%] }
        Duplicated array for seamless loop
        Pause on hover via whileHover

SECTION 6: PRICING
─────────────────────────────────────────────────
Motion: Feature list items animate in with stagger
        Recommended plan has continuous border gradient animation

SECTION 7: FOOTER CTA
─────────────────────────────────────────────────
Motion: Headline text reveals via clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
        triggered by useInView
```

#### App Shell Animations

```
SIDEBAR / DRAWER
  open:  x: -280 → 0, opacity: 0 → 1 (spring: stiffness:300, damping:30)
  close: x: 0 → -280 (tween: duration 0.2)
  backdrop: opacity 0→0.5 with blur(4px)

PAGE TRANSITIONS
  exit:  opacity: 1→0, y: 0→-8 (duration: 0.15)
  enter: opacity: 0→1, y: 8→0 (duration: 0.2, delay: 0.15)
  Wrap routes in AnimatePresence mode="wait"

MODULE CARDS (Dashboard widgets)
  mount: scale: 0.96→1, opacity: 0→1 with staggerChildren
  drag:  whileDrag scale:1.02, boxShadow elevation bump
  drop:  spring snap back

AGENT ACTION CARDS (surfaced recommendations)
  enter: x: 320→0 (slide from right), then slight overshoot spring
  dismiss: x: 0→-400, opacity: 1→0 (swipe left gesture supported)
  pulse ring: scale 1→1.4, opacity 1→0, loop 2s (like a ping)

AI THINKING STATE
  Dots: Three dots with stagger delay 0.15s each, y: 0→-4→0, loop
  Progress: SVG strokeDashoffset animated from full → 0

KANBAN BOARD
  Column enter: y: 20→0, opacity stagger per column
  Card drag: Smooth DnD with layoutId for position tracking
  Drop zone: scale: 1→1.02, borderColor → --nf-saffron

MOBILE BOTTOM NAV
  Active tab: indicator pill animates position with layoutId
  Icon: scale 1→1.15 on active, spring bounce
  FAB: rotate 0→45 on open (to form ✕), spring
```

---

## 4. Agentic Feature Map — Full Module Breakdown

> For each module: **Feature → Agentic Layer → Engine → Automation**

---

### MODULE 1: DASHBOARD (Business Brain Hub)

#### Features
- KPI cards: Revenue MTD, Bookings today, Clients active, Tasks overdue
- Revenue sparkline (last 30 days)
- Agent Activity Feed (live log of what agents did)
- Smart Digest: morning brief generated at 7AM
- Quick-add FAB (booking / client / task / invoice)
- Upcoming schedule strip (next 3 bookings)
- Inventory alert strip (low stock / expiry)

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Digest Agent** | Daily 6:50AM cron | Generates personalized morning brief from yesterday's data | Read-only, no mutations |
| **Anomaly Agent** | Revenue drops >20% vs last week | Surfaces alert card with possible causes | Read + notify |
| **Priority Agent** | 8AM daily | Re-ranks the day's tasks by urgency + client value | Suggests, user confirms |
| **Celebration Agent** | Revenue milestone hit | Triggers confetti + WhatsApp self-message | Read + send |

#### Engine
- **Frontend:** React + Vite, Recharts for sparklines, Framer Motion for widget entrance
- **Backend:** Supabase Edge Functions (cron via pg_cron)
- **AI:** Claude claude-sonnet-4-6 for digest generation, anomaly reasoning
- **Data:** Supabase Postgres, aggregated via materialized views
- **Realtime:** Supabase Realtime subscriptions for live feed

---

### MODULE 2: BOOKINGS (Intelligent Schedule Engine)

#### Features
- Calendar view (day / week / month) + list view
- Booking CRUD with client linkage
- Service catalog (custom services per business type)
- Duration + buffer time configuration
- Recurring booking support (daily / weekly / custom)
- Conflict detection + auto-resolution suggestions
- Waitlist management
- Automated reminders (24h, 2h before)
- Post-service feedback collection (auto-sent)
- Public booking widget (embeddable or via `/p/:slug`)
- Cancellation policy enforcement
- No-show tracking

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Booking Confirmation Agent** | New booking created | Sends WhatsApp confirmation + calendar invite | Auto-send within 2min |
| **Reminder Agent** | 24h & 2h before booking | Sends personalized reminder with service details | Auto-send |
| **No-show Agent** | Booking passes without check-in | Marks no-show, sends follow-up, flags in client profile | Mark + notify |
| **Reschedule Agent** | Cancellation received | Suggests 3 alternate slots, fills waitlist | Suggest + notify |
| **Demand Forecast Agent** | Weekly | Predicts busy slots next 2 weeks, suggests capacity adjustments | Suggest only |
| **Review Collection Agent** | 2h post-service | Sends review request via WhatsApp/email | Auto-send |

#### Engine
- **Frontend:** FullCalendar (React wrapper), custom day-view for mobile
- **Backend:** Supabase Edge Functions, pg_cron for scheduling
- **Messaging:** Meta WhatsApp Cloud API + Nodemailer
- **AI:** Claude for natural language booking via voice/chat
- **Conflict Detection:** PostgreSQL exclusion constraints on time ranges

#### Simple Mode Wizard (Booking)
```
Step 1: Select client (search or create new) → animated slide
Step 2: Choose service (visual cards with price) → animated slide
Step 3: Pick date (swipeable week strip) → animated slide
Step 4: Pick time (available slots grid) → animated slide
Step 5: Confirm (summary card + confetti micro-animation)
```

---

### MODULE 3: CLIENTS & NOTES (Relationship Intelligence)

#### Features
- Client profiles: name, phone, email, address, business-type custom fields
- Measurement vault (tailors: chest, waist, inseam; dog trainers: breed, weight, age)
- Tag system (VIP, At-risk, New, Seasonal)
- Interaction timeline (every booking, invoice, note, message)
- Rich notes (voice-to-text, markdown support)
- Client health score (engagement + payment history)
- Bulk import (CSV, WhatsApp contacts)
- Client portal link (read-only view they can access)
- Referral tracking
- Birthday / anniversary reminders
- Churn prediction

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Enrichment Agent** | New client created | Auto-fills missing data from phone/email lookup | Suggest, user confirms |
| **Health Score Agent** | Daily | Recalculates client health score based on recency, frequency, spend | Auto-calculate |
| **Churn Prevention Agent** | Client inactive >30 days (configurable) | Suggests re-engagement message, drafts it | Drafts, user sends |
| **Birthday Agent** | Client birthday -1 day | Sends greeting, attaches discount coupon | Auto-send (if enabled) |
| **Note Summarizer Agent** | Note saved | Extracts key action items, tags, and adds to profile | Auto-tag |
| **VIP Promotion Agent** | Client spend crosses threshold | Promotes to VIP, notifies business owner | Auto-tag + notify |

#### Engine
- **Frontend:** React, Tiptap (rich notes editor), Web Speech API (VoiceMic)
- **Backend:** Supabase Postgres, pgvector for semantic client search
- **AI:** Claude for note summarization, churn risk reasoning, re-engagement drafts
- **Storage:** Supabase Storage (profile photos, measurement attachments)
- **Search:** pg_trgm for fuzzy name/phone search + pgvector for semantic

#### Custom Fields by Business Type
```json
{
  "dog_trainer": ["breed", "age", "weight", "vaccination_date", "behavioral_notes"],
  "tailor": ["chest", "waist", "hips", "inseam", "shoulder", "sleeve", "fabric_preferences"],
  "photographer": ["shoot_type_preference", "delivery_format", "usage_rights"],
  "urban_farmer": ["delivery_address", "dietary_restrictions", "box_size", "frequency"]
}
```

---

### MODULE 4: INVOICES & PAYMENTS (Financial Autopilot)

#### Features
- Invoice CRUD (line items, GST, discount, TDS)
- Invoice templates (3 styles: minimal, branded, regional)
- PDF generation (server-side, branded)
- Public invoice link (`/invoice/:token`) — no login required
- Payment link integration (Razorpay / UPI QR)
- Partial payment tracking
- Recurring invoice generation
- Expense tracking (counter-ledger)
- P&L summary (MTD / YTD)
- GST report export
- Auto-send on booking completion (if configured)
- WhatsApp invoice sharing (PDF attached)
- Overdue escalation sequence (3-touch automated)

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Invoice Generation Agent** | Booking marked complete | Auto-drafts invoice with correct line items + GST | Draft (send needs confirm) |
| **Payment Reminder Agent** | Invoice overdue by 3/7/14 days | Sends escalating reminders (polite → firm → final) | Auto-send per schedule |
| **Reconciliation Agent** | Payment received (webhook) | Marks invoice paid, updates P&L, thanks client | Auto-update + send |
| **GST Agent** | Monthly (25th) | Generates GST summary, flags mismatches | Report + flag |
| **Cash Flow Agent** | Weekly | Projects next 30-day cash flow based on pending invoices | Read-only forecast |
| **Expense Categorizer Agent** | Expense entry saved | Suggests category (AI-classified), flags tax-deductible | Suggest |

#### Engine
- **Frontend:** React, react-pdf for preview, custom PDF template renderer
- **Backend:** Supabase Edge Functions, Puppeteer (server-side PDF)
- **Payments:** Razorpay SDK (payment links + webhooks), UPI QR generation
- **AI:** Claude for P&L narration, payment message tone adjustment
- **Storage:** Supabase Storage (invoice PDFs cached)

#### Overdue Escalation Sequence
```
Day 0: Invoice sent (WhatsApp + email)
Day 3: Gentle reminder ("Hope you received the invoice...")
Day 7: Firm reminder ("Payment is now overdue...")
Day 14: Final notice (PDF re-attached, payment link prominent)
Day 21: Flag in dashboard for manual intervention
```

---

### MODULE 5: INVENTORY (Stock Intelligence)

#### Features
- Product/material catalog
- Stock movement log (in / out / adjustment / waste)
- Low stock alerts (configurable threshold)
- Expiry tracking (for perishables — urban farmers)
- Restock suggestions with supplier contacts
- COGS calculation linked to invoices
- Batch tracking
- Inventory valuation (FIFO / Average cost)
- Barcode / QR scan (camera-based)
- Inventory reports

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Restock Agent** | Item below threshold | Drafts WhatsApp to supplier, suggests order quantity | Draft, user approves |
| **Expiry Agent** | Item expiring in <5 days | Alerts owner, suggests discount campaign | Alert + suggest |
| **Waste Reduction Agent** | Weekly | Analyzes waste patterns, suggests ordering adjustments | Report + suggest |
| **COGS Agent** | Invoice finalized | Links materials consumed to invoice, calculates margin | Auto-calculate |
| **Demand Forecast Agent** | Monthly | Predicts next 30-day material needs based on bookings | Forecast report |

#### Engine
- **Frontend:** React, react-webcam (barcode scan), custom stock movement timeline
- **Backend:** Supabase Postgres with FIFO logic in PL/pgSQL
- **AI:** Claude for restock reasoning, waste pattern analysis
- **Barcode:** ZXing library for QR/barcode decode in browser

---

### MODULE 6: TASKS (Agentic Work Queue)

#### Features
- Kanban, List, and Calendar views
- Subtasks with nested completion
- Due dates + time estimates
- Priority: Urgent / High / Normal / Low
- Recurring tasks (daily / weekly / monthly)
- Task templates (per business type)
- Assignee support (for teams)
- Task linking (link to client, booking, or invoice)
- Drag & drop reordering
- Bulk actions
- Time tracking per task
- Completion streaks + gamification

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Task Generator Agent** | Booking confirmed | Creates standard task checklist for service type | Auto-create |
| **Reprioritizer Agent** | Daily 7AM | Re-ranks open tasks by deadline proximity + client value | Suggest reorder |
| **Overdue Escalator Agent** | Task past due | Notifies owner, suggests reschedule or delegation | Notify + suggest |
| **Recurring Task Agent** | pg_cron schedule | Creates next occurrence of recurring tasks | Auto-create |
| **Completion Insight Agent** | Weekly | "You completed 23/30 tasks this week. 3 patterns..." | Read + report |

#### Engine
- **Frontend:** React, dnd-kit (drag & drop), FullCalendar (calendar view)
- **Backend:** Supabase Postgres, pg_cron (recurring), Edge Functions
- **AI:** Claude for task generation from booking context, completion insights
- **Realtime:** Supabase Realtime (team task sync)

---

### MODULE 7: PUBLIC PRESENCE (Business Page Builder)

#### Features
- Drag & drop page editor (no code)
- Sections: Hero, Services, About, Gallery, Reviews, Booking Widget, Contact
- Custom slug (`/p/dog-trainer-rohan-pune`)
- SEO meta tags (auto-generated by AI)
- WhatsApp floating button
- Google Maps embed
- Review collection + display
- Page analytics (views, booking conversions)
- Social card preview (OG image auto-generated)
- Custom domain support (CNAME)
- Dark/Light mode for public page

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **SEO Agent** | Page published | Generates meta title, description, keywords | Auto-write, editable |
| **OG Image Agent** | Page saved | Renders branded OG image with business name + photo | Auto-generate |
| **Review Synthesizer Agent** | New review received | Generates owner reply suggestion | Draft, owner posts |
| **Conversion Agent** | Weekly | Analyzes page → booking funnel, suggests copy improvements | Report + suggest |
| **Content Freshness Agent** | Monthly | Flags stale content (old photos, outdated prices) | Alert |

#### Engine
- **Frontend:** React, custom block editor (inspired by Notion blocks)
- **Backend:** Supabase Edge Functions, Next.js ISR for public pages
- **Image Gen:** Puppeteer (OG image rendering) or Vercel OG
- **Analytics:** PostHog (embedded, GDPR-light)
- **CDN:** Cloudflare (public pages cached at edge)

---

### MODULE 8: AI ASSISTANT (NicheFlow Brain — Floating)

#### Features
- Floating chat interface (bottom-right, collapsible)
- Business-context aware (knows your clients, bookings, inventory)
- Suggested prompts (contextual, changes based on active module)
- Voice input (VoiceMic)
- Action execution: "Create a booking for Priya tomorrow at 3PM"
- Multi-turn memory within session
- Hindi support ("कल का schedule दिखाओ")
- Action audit trail (logs every AI action to dashboard feed)
- "Explain this" mode (click any number/metric → AI explains)
- Proactive nudges (agent surfaces insights without being asked)

#### Agentic Layer
The AI Assistant IS the orchestrator. It:
1. Receives intent (text/voice)
2. Classifies intent → routes to appropriate module agent
3. Retrieves relevant context (client history, calendar, inventory)
4. Executes action OR drafts for confirmation
5. Logs action to audit feed
6. Learns from user correction

#### Engine
- **Model:** Claude claude-sonnet-4-6 (primary), claude-haiku-4-5 (quick queries)
- **Orchestration:** Custom tool-use schema per module
- **Context:** System prompt injected with workspace config + today's summary
- **Voice:** Web Speech API → text → Claude
- **Frontend:** Framer Motion AnimatePresence for chat bubble expansion
- **Memory:** Session context in React state + Supabase for persistent preferences

#### Tool Use Schema (Claude Function Calling)
```json
{
  "tools": [
    { "name": "create_booking", "params": ["client_id", "service_id", "datetime"] },
    { "name": "get_client", "params": ["query"] },
    { "name": "create_invoice", "params": ["client_id", "line_items"] },
    { "name": "list_today_schedule", "params": [] },
    { "name": "check_inventory", "params": ["item_id"] },
    { "name": "create_task", "params": ["title", "due_date", "priority"] },
    { "name": "send_whatsapp", "params": ["phone", "template", "variables"] },
    { "name": "get_revenue_summary", "params": ["period"] }
  ]
}
```

---

### MODULE 9: COMMAND PALETTE (⌘K)

#### Features
- Global keyboard shortcut (⌘K / Ctrl+K)
- Instant fuzzy search: clients, bookings, invoices, tasks
- AI routing ("Ask AI: what's my revenue this week?")
- Quick navigation (type "dash", "book", "inv" → navigate)
- Recent actions history
- Keyboard-navigable results

#### Engine
- **Frontend:** cmdk library (React), Fuse.js (fuzzy search)
- **Backend:** Supabase full-text search (pg_trgm), client-side cache
- **AI:** Inline Claude query for AI-prefixed searches

---

### MODULE 10: SETTINGS & WORKSPACE

#### Features
- Business profile (name, logo, GST number, address)
- Business type configuration (unlocks custom fields + task templates)
- Team management (invite → role → permissions)
- AI preferences (autonomy level: Conservative / Balanced / Autonomous)
- Notification preferences (WhatsApp / Email / Push)
- Language settings (EN / HI / more)
- Working hours + holidays configuration
- Integration hub (WhatsApp, Razorpay, Google Calendar, Tally)
- Subscription & billing management
- Data export (GDPR-compliant)
- Workspace themes (Light / Dark / System)

#### Agentic Layer
| Agent | Trigger | Action | Boundary |
|---|---|---|---|
| **Onboarding Agent** | New workspace created | Guides through 5-step setup, pre-configures agents | Wizard-driven |
| **Integration Health Agent** | Daily | Checks all connected integrations for errors | Alert if broken |
| **Usage Coach Agent** | Weekly | "You haven't used Invoices yet — here's how it saves time" | Nudge notification |

---

### MODULE 11: ONBOARDING (Zero-Friction Setup)

#### Features
- Business type selector (visual cards with persona illustrations)
- 5-question setup wizard (name, services, pricing, team size, primary language)
- Auto-configuration of agents based on business type
- Sample data population (skippable)
- First booking in <3 minutes challenge
- Video micro-tour (30 seconds, skippable)
- Progress indicator with celebration on completion

#### Agentic Layer
- **Setup Agent:** Takes wizard answers → configures workspace, creates default services, sets agent autonomy defaults, populates task templates
- **First Action Agent:** Waits for first real booking/client → sends congratulations + "what's next" card

---

### MODULE 12: LOCALIZATION ENGINE (i18n)

#### Features
- i18next integration (React)
- Language toggle (EN ↔ HI, persistent in user profile)
- Number formatting (₹ currency, Indian number system: lakh, crore)
- Date formatting (DD/MM/YYYY default, regional calendar awareness)
- AI responses in selected language
- Right-to-left preparation (future: Urdu, Arabic)
- Translation management via Tolgee (or Lokalise)

#### Engine
- **Library:** i18next + react-i18next
- **Namespaces:** `common`, `bookings`, `clients`, `invoices`, `tasks`, `settings`
- **AI:** Claude system prompt instructs response language based on `user.language`
- **Fonts:** Noto Sans Devanagari loaded lazily on HI selection

---

## 5. Infrastructure Layers

### Layer 1: Frontend Foundations

```
CORE FRAMEWORK
  React 18 + Vite 5
  TypeScript (strict mode)
  React Router v6 (client-side routing, public pages via Next.js)

STATE MANAGEMENT
  Zustand (global: auth, workspace, agent queue)
  TanStack Query v5 (server state, caching, optimistic updates)
  React Context (theme, locale, simple mode toggle)

UI COMPONENT SYSTEM
  shadcn/ui (base components)
  Radix UI primitives (accessibility)
  Tailwind CSS v4 (utility-first, custom tokens via CSS variables)
  Framer Motion (all animations)
  Lucide React (icons)

FORM HANDLING
  React Hook Form + Zod (schema validation)

TABLE / DATA
  TanStack Table v8

CALENDAR
  FullCalendar (React)
  react-big-calendar (mobile alternative)

CHARTS
  Recharts (KPI sparklines, P&L charts)
  Tremor (dashboard widgets)

EDITOR
  Tiptap (rich notes)
  Custom block editor (public page builder)

MOBILE
  Capacitor (optional native wrapper for PWA→App Store)
  PWA manifest + service worker (Workbox)
```

---

### Layer 2: APIs & Backend Logic

```
PRIMARY BACKEND
  Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)

EDGE FUNCTIONS (Deno / TypeScript)
  /functions/ai-assistant        → Claude claude-sonnet-4-6 orchestration
  /functions/booking-agent       → Reminders, confirmations, rescheduling
  /functions/invoice-agent       → Generation, overdue escalation
  /functions/digest-agent        → Morning brief generation (cron)
  /functions/client-agent        → Churn detection, birthday triggers
  /functions/inventory-agent     → Restock alerts, expiry checks
  /functions/whatsapp-sender     → Meta WhatsApp Cloud API dispatcher
  /functions/pdf-generator       → Puppeteer invoice PDF
  /functions/public-page         → ISR page rendering
  /functions/webhooks/razorpay   → Payment confirmation handler
  /functions/webhooks/whatsapp   → Incoming message handler

EXTERNAL APIs
  Anthropic API (Claude claude-sonnet-4-6 + Haiku)
  Meta WhatsApp Business Cloud API
  Razorpay (payment links, webhooks)
  Google Calendar API (optional sync)
  Twilio (fallback SMS)
  SendGrid (email)
  Cloudinary (image optimization, optional)

CRON JOBS (pg_cron in Supabase)
  '50 6 * * *'  → digest-agent (6:50 AM daily)
  '0 9 * * *'   → birthday-agent (9 AM daily)
  '0 8 * * *'   → reprioritizer-agent (8 AM daily)
  '0 0 * * 0'   → demand-forecast-agent (Sunday midnight)
  '0 10 25 * *' → gst-agent (25th of month)
  Every 5 min   → booking-reminder-check
```

---

### Layer 3: Database & Storage

```
DATABASE: Supabase PostgreSQL 15

EXTENSIONS ENABLED
  uuid-ossp       (UUID generation)
  pgvector        (semantic search embeddings)
  pg_trgm         (fuzzy text search)
  pg_cron         (scheduled jobs)
  pg_stat_statements (query performance)
  moddatetime     (auto updated_at timestamps)

CORE TABLES
  workspaces          (multi-tenant root)
  users               (auth.users linked)
  workspace_members   (user ↔ workspace ↔ role)
  clients             (per workspace)
  client_custom_fields (dynamic fields by business type)
  services            (per workspace)
  bookings            (linked to clients + services)
  booking_recurrences (recurrence rules)
  invoices            (linked to bookings + clients)
  invoice_items       (line items)
  payments            (linked to invoices)
  expenses            (counter-ledger)
  inventory_items     (per workspace)
  inventory_movements (in/out/waste/adjustment)
  tasks               (per workspace)
  subtasks            (linked to tasks)
  notes               (linked to clients/tasks/bookings)
  agent_actions_log   (audit trail for all agent actions)
  notifications       (in-app + push queue)
  public_pages        (slug → block content JSONB)
  reviews             (linked to clients + public pages)
  integrations        (per workspace: WhatsApp token, Razorpay, etc.)
  workspace_settings  (language, autonomy level, working hours)
  embeddings          (pgvector: client notes + AI context)

STORAGE BUCKETS
  profile-photos        (public, with CDN)
  invoice-pdfs          (private, signed URLs)
  public-page-assets    (public, Cloudflare CDN)
  attachments           (private, 50MB limit)

MATERIALIZED VIEWS (refreshed every 15 min via cron)
  mv_revenue_daily      (pre-aggregated for dashboard)
  mv_client_health      (health scores per client)
  mv_inventory_alerts   (items below threshold or expiring)
```

---

### Layer 4: Auth & Permissions

```
AUTH PROVIDER: Supabase Auth

METHODS SUPPORTED
  Email + Password (primary)
  OTP via Email (magic link)
  OTP via Phone (WhatsApp OTP — custom Edge Function)
  Google OAuth (optional)

ROLES (stored in workspace_members.role)
  owner       → Full access + billing
  admin       → Full access, no billing
  staff       → Bookings, clients, tasks (no delete, no billing)
  viewer      → Read-only dashboard

ROW LEVEL SECURITY (RLS)
  Enabled on ALL tables
  All queries filtered by: workspace_id = current_workspace_id()
  Role-based policies:
    owners/admins → SELECT + INSERT + UPDATE + DELETE
    staff         → SELECT + INSERT + UPDATE (no DELETE)
    viewers       → SELECT only
  Public pages → Separate non-RLS schema (public_schema)
  Agent functions → Service Role key (bypasses RLS, used server-side only)

AGENT PERMISSION MODEL
  Each agent operates under a signed JWT with:
    - workspace_id claim
    - agent_id claim
    - allowed_actions[] claim (scoped tool list)
  Agent JWT expires in 1h, refreshed by orchestrator

SESSION MANAGEMENT
  JWT expiry: 1 hour (access token)
  Refresh token: 30 days
  Refresh token rotation enabled
  Logout: revokes refresh token

PUBLIC ENDPOINTS (no auth)
  GET /p/:slug          (public business page)
  GET /invoice/:token   (public invoice view)
  POST /book/:slug      (public booking submission)
```

---

### Layer 5: Hosting & Deployment

```
FRONTEND (App)
  Platform: Vercel (Pro)
  Region: Mumbai (ap-south-1) primary
  Build: Vite → static, deployed to Vercel Edge Network
  Environment: production / staging / preview (per PR)

FRONTEND (Public Pages — ISR)
  Platform: Vercel (Next.js ISR)
  Cache: Revalidate on page save (on-demand ISR)
  CDN: Cloudflare in front of Vercel for extra cache layer

BACKEND
  Platform: Supabase Cloud (Pro tier)
  Region: ap-south-1 (Mumbai)
  Edge Functions: Deno Deploy (bundled with Supabase)

PDF GENERATION
  Platform: Vercel Serverless Function (Puppeteer via @sparticuz/chromium)
  Alternatively: Browserless.io API (cost-efficient)

DOMAIN ARCHITECTURE
  app.nicheflow.in        → Vercel (main app)
  api.nicheflow.in        → Supabase REST (proxied)
  p.nicheflow.in/:slug    → Next.js ISR public pages
  cdn.nicheflow.in        → Cloudflare R2 (assets)
  Custom domains          → Cloudflare CNAME → p.nicheflow.in
```

---

### Layer 6: Cloud & Compute

```
COMPUTE
  Supabase Edge Functions: Deno isolates (auto-scaled, regional)
  Vercel Functions: Node.js / Edge (auto-scaled)
  pg_cron: Runs inside Postgres (no separate compute needed)

STORAGE & CDN
  Supabase Storage: S3-compatible, Mumbai region
  Cloudflare R2: Zero-egress CDN for public assets
  Cloudflare Cache: Public pages TTL 1h, purged on edit

QUEUING (Agent Jobs)
  Supabase Database Queue (pgmq extension) for async agent tasks
  Pattern: Edge Function enqueues job → worker Edge Function processes
  Retry: 3 attempts with exponential backoff

VECTOR / AI MEMORY
  pgvector on Supabase Postgres
  Embeddings via: Anthropic claude-sonnet-4-6 embeddings API (or OpenAI ada-002)
  Used for: semantic client search, agent context retrieval

EXTERNAL COMPUTE (Heavy Tasks)
  PDF generation: Vercel Function with @sparticuz/chromium
  Image OG generation: Vercel OG (@vercel/og)
  Batch AI jobs: Anthropic Batch API (for monthly reports, GST summaries)
```

---

### Layer 7: CI/CD & Version Control

```
VERSION CONTROL
  GitHub (private monorepo)
  Monorepo structure:
    /apps/web          → React + Vite frontend
    /apps/public       → Next.js public pages
    /packages/ui       → Shared component library
    /packages/agents   → Agent logic (shared between Edge Functions)
    /supabase          → Migrations, Edge Functions, seeds
    /docs              → Architecture docs (this file lives here)

BRANCH STRATEGY
  main          → Production (protected, requires PR + review)
  staging       → Pre-production (auto-deploy to staging)
  feature/*     → Feature branches (PR → staging)
  hotfix/*      → Emergency fixes (PR → main directly)

CI/CD PIPELINES (GitHub Actions)

  PR Pipeline:
    1. Lint (ESLint + Prettier check)
    2. Type check (tsc --noEmit)
    3. Unit tests (Vitest)
    4. E2E tests (Playwright, smoke suite only on PR)
    5. Supabase migrations dry-run
    6. Vercel preview deploy (automatic)

  Staging Pipeline (merge to staging):
    1. All above
    2. Supabase migration apply (staging project)
    3. Vercel staging deploy
    4. E2E full suite (Playwright against staging)
    5. Slack notification

  Production Pipeline (merge to main):
    1. All above
    2. Supabase migration apply (prod, with backup first)
    3. Vercel production deploy
    4. Smoke test (automated ping of critical endpoints)
    5. Sentry release created
    6. Rollback trigger available (revert last migration)

DATABASE MIGRATIONS
  Tool: Supabase CLI (supabase db diff → migration file)
  Migration files in /supabase/migrations (numbered, timestamped)
  Never edit applied migrations; always new migration file
  Seed data in /supabase/seed.sql (staging only)
```

---

### Layer 8: Security & Row Level Security (RLS)

```
APPLICATION SECURITY

  Input Validation:
    All inputs validated via Zod schemas (frontend + Edge Function)
    Phone numbers: E.164 format enforced
    SQL: Parameterized queries only (Supabase client handles this)
    File uploads: MIME type + size validation server-side

  API Security:
    All Edge Functions require Authorization: Bearer <jwt>
    Service role key never exposed to frontend
    Anthropic API key stored in Supabase secrets (never in env vars committed)
    Razorpay webhook signature verified (HMAC-SHA256)
    WhatsApp webhook verified via hub.verify_token

  Secrets Management:
    Supabase Vault (for per-workspace secrets: WhatsApp tokens, Razorpay keys)
    GitHub Secrets (for CI/CD pipeline secrets)
    Vercel Environment Variables (frontend env)

ROW LEVEL SECURITY (RLS) — DETAILED

  Pattern: Every table has workspace_id column.
  Helper function:
    CREATE OR REPLACE FUNCTION current_workspace_id()
    RETURNS UUID AS $$
      SELECT (current_setting('app.workspace_id', true))::UUID
    $$ LANGUAGE SQL STABLE;

  Example policy (bookings table):
    CREATE POLICY "workspace_isolation" ON bookings
      USING (workspace_id = current_workspace_id());

    CREATE POLICY "staff_no_delete" ON bookings
      FOR DELETE USING (
        (SELECT role FROM workspace_members
         WHERE user_id = auth.uid()
         AND workspace_id = current_workspace_id()) IN ('owner', 'admin')
      );

  Agent access (service role bypasses RLS):
    Agent Edge Functions use SUPABASE_SERVICE_ROLE_KEY
    Every agent action records agent_id + workspace_id in agent_actions_log
    Agents cannot exceed their allowed_actions[] claim

  Public schema (no RLS needed — no PII):
    public_pages, reviews (public fields only)
    Separate schema: public_schema
    Accessed without JWT on GET requests

CONTENT SECURITY POLICY (CSP)
  default-src 'self'
  script-src 'self' 'nonce-{random}' (no unsafe-inline)
  connect-src 'self' https://*.supabase.co https://api.anthropic.com
  img-src 'self' data: blob: https://cdn.nicheflow.in

RATE LIMITING (see Layer 9)

HTTPS
  All traffic HTTPS (enforced by Vercel + Cloudflare)
  HSTS enabled (max-age: 31536000; includeSubDomains; preload)

DATA PRIVACY
  PII encrypted at rest (Supabase default AES-256)
  Phone numbers hashed in search indexes
  GDPR-compliant export endpoint (/api/export/workspace)
  Data deletion cascade on workspace deletion
```

---

### Layer 9: Rate Limiting

```
EDGE RATE LIMITING (Cloudflare)
  Public pages:       1000 req/min per IP
  Public booking:     10 req/min per IP (anti-spam)
  Public invoice view: 100 req/min per token

APPLICATION RATE LIMITING (Upstash Redis + Ratelimit SDK)
  Mounted in Edge Functions middleware

  AI Assistant:
    Free tier:    20 queries/day per workspace
    Paid tier:    500 queries/day per workspace
    Burst:        5 queries/minute per user

  WhatsApp Sender:
    10 messages/minute per workspace (Meta API limits)
    Queue overflow handled by pgmq (delays, not drops)

  Invoice Generation:
    50 PDFs/day per workspace (free), unlimited (paid)

  API Endpoints:
    Authenticated:  100 req/min per user
    Unauthenticated: 20 req/min per IP

  Booking Widget:
    30 submissions/hour per IP

RATE LIMIT RESPONSE
  HTTP 429 with Retry-After header
  User-facing: Toast notification with wait time
  Agent jobs: Re-queued with backoff (not dropped)

IMPLEMENTATION
  Upstash Redis (serverless, global, edge-compatible)
  @upstash/ratelimit library in Edge Functions
  Sliding window algorithm for most limits
  Fixed window for AI queries (daily resets at midnight IST)
```

---

### Layer 10: Caching & CDN

```
CDN (Cloudflare)
  All static assets (JS, CSS, images): cached indefinitely (hashed filenames)
  Public pages (/p/:slug): TTL 1h, purged on page save via Cloudflare API
  OG images: TTL 24h
  Invoice PDFs: NOT cached (signed URLs, time-limited)

BROWSER CACHING
  Service Worker (Workbox):
    Strategy: Cache-first for assets, Network-first for API
    Offline: Last-loaded dashboard state served from cache
    Background sync: Queues mutations made offline

APPLICATION CACHING (TanStack Query)
  staleTime per query type:
    clients list:     5 minutes
    bookings today:   1 minute (near-realtime)
    invoice list:     5 minutes
    dashboard KPIs:   2 minutes
    inventory:        10 minutes
    public page:      60 minutes (rarely changes)

SERVER-SIDE CACHING (Supabase)
  Materialized views refreshed every 15 min (pg_cron)
  Connection pooling: PgBouncer (Supabase built-in, transaction mode)
  Max connections: 60 (Supabase Pro default, sufficient for MVP)

EDGE CACHING (Vercel)
  Public Next.js pages: ISR with revalidation on demand
  API routes: no-store (dynamic data)
  Static assets: immutable cache headers

REALTIME (Supabase Realtime)
  Channels subscribed per session:
    workspace:{id}:notifications
    workspace:{id}:agent_actions
    workspace:{id}:bookings (if calendar open)
  Unsubscribed on component unmount to avoid leaks
```

---

### Layer 11: Load Balancing & Scaling

```
FRONTEND SCALING
  Vercel: Auto-scales globally (CDN edge nodes)
  No configuration needed (managed)

BACKEND SCALING (Supabase)
  PostgreSQL: Vertical scaling (upgrade plan tier)
  Connection Pooler: PgBouncer (handles N connections → M DB connections)
  Edge Functions: Auto-scaled by Deno Deploy (no config needed)
  Read Replicas: Available on Supabase Business tier (enable when needed)

ESTIMATED CAPACITY (Supabase Pro, without read replicas)
  Concurrent users: ~500 (connection pool limited)
  Requests/second: ~1000 (Postgres can handle)
  Storage: 100GB included
  Edge Function invocations: 2M/month included

SCALE-UP TRIGGERS (monitor these metrics)
  DB connections > 80% of pool → add read replica
  Edge Function p99 latency > 2s → investigate cold starts
  Storage > 80GB → upgrade or archive old PDFs
  Monthly AI token cost > budget → upgrade to Anthropic Batch API

HORIZONTAL SCALING PLAN (Post-MVP)
  Multi-region Supabase (when users outside India appear)
  Dedicated Postgres clusters per large enterprise workspace
  Separate read replica for reporting/analytics queries
  Move heavy AI batch jobs to dedicated worker service (Railway / Fly.io)
```

---

### Layer 12: Error Tracking & Logs

```
ERROR TRACKING
  Platform: Sentry (React SDK + Deno SDK for Edge Functions)
  
  Frontend:
    Sentry.init with tracing (5% sample rate on prod)
    Custom context: workspace_id, user_id, active_module
    Source maps uploaded on deploy (Sentry Webpack plugin)
    Replay: 10% session replay on errors

  Edge Functions:
    Sentry Deno SDK
    Unhandled promise rejections caught and reported
    Agent failures: custom fingerprinting by agent_id

  Error Grouping:
    By: type, module, agent_id
    Ignored: Network timeouts (handled gracefully in UI), 
             Rate limit 429s (expected)

LOGGING
  Application logs: Supabase Edge Function logs (Logflare)
  Structured JSON logs from all Edge Functions:
    { timestamp, level, function_name, workspace_id, 
      agent_id, duration_ms, status, error? }
  Log retention: 7 days (free), 30 days (paid Logflare)
  
  Agent Audit Log (database table):
    agent_actions_log: every agent action permanently recorded
    Queryable from dashboard (Settings → Agent History)

ALERTING
  Sentry Alerts → Slack #nicheflow-errors
  Uptime alerts → PagerDuty (or simple email)
  Thresholds:
    Error rate > 1% in 5 min → immediate alert
    P99 latency > 3s → warning
    Edge Function failure rate > 5% → critical

PERFORMANCE MONITORING
  Vercel Analytics (Core Web Vitals per page)
  Sentry Performance (traces for slow API calls)
  PostHog (product analytics: feature usage, funnels)
  Target: LCP < 2.5s, FID < 100ms, CLS < 0.1
```

---

### Layer 13: Availability & Recovery

```
UPTIME TARGETS
  App SLA: 99.5% (MVP target)
  Planned maintenance: Sunday 2-4 AM IST (announced 24h prior)

MONITORING
  Uptime Robot (or Better Uptime): checks every 1 min
  Endpoints monitored:
    https://app.nicheflow.in          (frontend)
    https://app.nicheflow.in/api/health  (backend health)
    https://p.nicheflow.in/health     (public pages)
  Alert: Slack + email + SMS if down > 2 min

BACKUP STRATEGY
  Supabase automatic backups: daily (Pro tier), 7-day retention
  Pre-migration backup: triggered by CI/CD before every migration
  Storage backups: Supabase Storage versioning enabled
  Manual backup before major releases: pg_dump to Supabase Storage

DISASTER RECOVERY (RTO/RPO)
  RTO (Recovery Time Objective): < 2 hours
  RPO (Recovery Point Objective): < 24 hours (daily backup)
  
  Runbook:
    1. Identify failure scope (DB / Functions / Frontend)
    2. Frontend failure → Vercel rollback (1-click)
    3. DB data loss → Restore from latest daily backup
    4. Migration failure → supabase db reset --linked (staging only)
                       → Manual rollback migration (prod)
    5. Service degradation → Scale up Supabase plan

GRACEFUL DEGRADATION
  If Anthropic API down:
    AI features show "AI unavailable" banner
    Core CRUD features work normally
    Queued agent jobs retry when API recovers

  If WhatsApp API down:
    Messages queued in pgmq
    Fallback to email/SMS (Twilio)
    Dashboard shows "WhatsApp service degraded" notice

  If Razorpay down:
    Manual payment recording still works
    UPI QR still renders (static image)
    Webhook events buffered and retried

FEATURE FLAGS
  Tool: Vercel Feature Flags (or custom in workspace_settings)
  Use for: Gradual rollout of new agent features
  Pattern: Check flag before enabling agent in onboarding
  Allows: Instant kill-switch for any agent behavior without deploy

ROLLBACK PROCEDURE
  Frontend: Vercel instant rollback (< 30 seconds)
  Database: Apply reverse migration file (or restore backup)
  Edge Functions: Redeploy previous version via GitHub Actions
  Communication: Status page update (statuspage.io or simple notion page)
```

---

## 6. Full Technology Stack

```
FRONTEND
  React 18, Vite 5, TypeScript 5
  Tailwind CSS v4, shadcn/ui, Radix UI
  Framer Motion 11
  TanStack Query v5, Zustand
  React Hook Form + Zod
  Tiptap, FullCalendar, dnd-kit
  Recharts, Tremor
  cmdk, Fuse.js
  i18next + react-i18next
  Workbox (PWA)

PUBLIC PAGES
  Next.js 14 (App Router, ISR)

BACKEND
  Supabase (PostgreSQL 15, Auth, Storage, Realtime, Edge Functions)
  Deno (Edge Function runtime)

AI
  Anthropic Claude claude-sonnet-4-6 (primary)
  Anthropic Claude Haiku (quick queries)
  pgvector (semantic search)

MESSAGING
  Meta WhatsApp Cloud API
  SendGrid (email)
  Twilio (SMS fallback)

PAYMENTS
  Razorpay

INFRASTRUCTURE
  Vercel (frontend + public pages hosting)
  Cloudflare (CDN, DNS, R2 storage, rate limiting)
  Upstash Redis (rate limiting, pub/sub)
  Supabase Cloud (Mumbai region)

OBSERVABILITY
  Sentry (error tracking + performance)
  PostHog (product analytics)
  Uptime Robot (uptime monitoring)
  Logflare (Edge Function logs)

CI/CD
  GitHub Actions
  Supabase CLI
  Vercel CLI
  Playwright (E2E)
  Vitest (unit tests)

SECURITY
  Supabase Vault (secrets)
  Cloudflare WAF (DDoS, bot protection)
  OWASP Top 10 compliance checklist (pre-launch)
```

---

## 7. Database Schema Overview

```sql
-- WORKSPACE (multi-tenant root)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT NOT NULL, -- 'dog_trainer' | 'tailor' | 'photographer' | etc
  logo_url TEXT,
  gst_number TEXT,
  address JSONB,
  language TEXT DEFAULT 'en',
  agent_autonomy TEXT DEFAULT 'balanced', -- 'conservative' | 'balanced' | 'autonomous'
  working_hours JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  health_score INTEGER DEFAULT 100, -- 0-100
  embedding VECTOR(1536), -- pgvector for semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  service_id UUID REFERENCES services(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed | cancelled | no_show | completed
  notes TEXT,
  recurrence_rule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  EXCLUDE USING GIST (
    workspace_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) -- conflict prevention
);

-- INVOICES
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  booking_id UUID REFERENCES bookings(id),
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft', -- draft | sent | paid | overdue | cancelled
  subtotal NUMERIC(10,2),
  tax_amount NUMERIC(10,2),
  discount_amount NUMERIC(10,2),
  total NUMERIC(10,2),
  due_date DATE,
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT ACTIONS LOG (audit trail)
CREATE TABLE agent_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id),
  agent_id TEXT NOT NULL, -- 'booking_agent' | 'invoice_agent' | etc
  action_type TEXT NOT NULL,
  entity_type TEXT, -- 'booking' | 'client' | 'invoice'
  entity_id UUID,
  description TEXT NOT NULL, -- plain language description
  payload JSONB,
  status TEXT DEFAULT 'completed', -- completed | failed | pending_approval
  user_override BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- All tables have: RLS ENABLED + workspace_id isolation policies
```

---

## 8. Agent Architecture & Orchestration

```
NICHEFLOW BRAIN (Central Orchestrator)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    ┌─────────────────────┐
                    │  USER / TRIGGER     │
                    │  (UI / cron / hook) │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   ORCHESTRATOR      │
                    │  (Edge Function)    │
                    │  - Intent classify  │
                    │  - Agent routing    │
                    │  - Conflict resolve │
                    │  - Audit logging    │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
  ┌────────▼──────┐  ┌────────▼──────┐  ┌────────▼──────┐
  │ BOOKING AGENT │  │ INVOICE AGENT │  │ CLIENT AGENT  │
  └────────┬──────┘  └────────┬──────┘  └────────┬──────┘
           │                   │                   │
           └───────────────────▼───────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SHARED TOOLS      │
                    │  - WhatsApp sender  │
                    │  - Email sender     │
                    │  - Supabase DB      │
                    │  - Claude API       │
                    └─────────────────────┘

AGENT COMMUNICATION PROTOCOL
  1. Trigger arrives (webhook / cron / user action)
  2. Orchestrator classifies intent using Claude
  3. Routes to appropriate agent(s)
  4. Agent fetches context from DB
  5. Agent calls Claude with context + tool schema
  6. Claude responds with tool_use block
  7. Agent executes tool call (DB mutation / API call)
  8. Result logged to agent_actions_log
  9. Notification sent to user (if action taken)
  10. UI subscribes to agent_actions_log via Realtime

AUTONOMY LEVELS
  Conservative: Agent drafts → user approves every action
  Balanced:     Agent auto-sends reminders, drafts invoices
  Autonomous:   Agent acts fully, logs retroactively, user reviews log

AGENT MEMORY ARCHITECTURE
  Short-term:  System prompt with today's summary (rebuilt each invocation)
  Medium-term: Last 30 actions per workspace (from agent_actions_log)
  Long-term:   pgvector embeddings of client notes + business patterns
```

---

## 9. Security, Auth & Permissions

*(Already detailed in Layer 4 and Layer 8 above — see those sections)*

**Quick Reference Checklist:**
- [x] RLS on all tables
- [x] Service role key server-side only
- [x] All secrets in Supabase Vault
- [x] Webhook signatures verified (Razorpay, WhatsApp)
- [x] Input validation (Zod) on frontend + Edge Functions
- [x] CSP headers configured
- [x] HTTPS enforced everywhere
- [x] Phone numbers not stored in plain text in search indexes
- [x] PII encrypted at rest (Supabase default)
- [x] Agent JWT scoped to allowed_actions
- [x] Rate limiting on all AI endpoints
- [x] GDPR-compliant data export + deletion

---

## 10. CI/CD & DevOps Pipeline

*(Already detailed in Layer 7 above)*

**Quick Pipeline Summary:**
```
Push to feature/* → PR created
  └─ Lint + Types + Tests (Vitest) + Preview Deploy (Vercel)

Merge to staging
  └─ Full E2E (Playwright) + DB Migration (staging) + Staging Deploy

Merge to main
  └─ DB Backup + DB Migration (prod) + Production Deploy + Smoke Tests + Sentry Release
```

---

## 11. Error Tracking, Observability & Recovery

*(Already detailed in Layers 12 & 13 above)*

---

## 12. MVP Scoping & Launch Roadmap

### MVP Definition (3 months to launch)

**In Scope (MVP):**
| Module | MVP Features | Agents Included |
|---|---|---|
| Dashboard | KPI cards, Agent feed, Quick-add | Digest Agent, Anomaly Agent |
| Bookings | CRUD + Calendar + Reminders | Confirmation + Reminder + No-show |
| Clients | Profile + Notes + Timeline | Health Score + Churn Prevention |
| Invoices | CRUD + PDF + WhatsApp share | Generation + Overdue Reminder |
| Tasks | Kanban + List only | Task Generator + Recurring |
| AI Assistant | Chat + Voice input | All tools (read + write) |
| Public Page | Basic page + Booking widget | SEO Agent |
| Settings | Business profile + Team + Language | Onboarding Agent |
| Onboarding | 5-step wizard | Setup Agent |

**Deferred (Post-MVP):**
- Inventory module (v1.1)
- Custom domain for public pages (v1.1)
- Google Calendar sync (v1.1)
- Expense tracking (v1.2)
- Multi-location workspace (v1.3)
- Mobile app (Capacitor wrapper) (v2.0)
- Tally / accounting integration (v2.0)

---

### Phase Plan

```
PHASE 0 — Foundation (Weeks 1-2)
  ✓ Supabase project setup (Mumbai)
  ✓ Schema + migrations + RLS policies
  ✓ Auth flow (email + magic link)
  ✓ Workspace creation + onboarding wizard
  ✓ Design system setup (Tailwind tokens, shadcn, Framer Motion base)
  ✓ CI/CD pipeline (GitHub Actions + Vercel)

PHASE 1 — Core CRUD (Weeks 3-5)
  ✓ Clients module (full CRUD + notes)
  ✓ Bookings module (CRUD + calendar view)
  ✓ Services catalog
  ✓ Basic dashboard (KPI cards)
  ✓ Command palette (⌘K)

PHASE 2 — Financial Layer (Weeks 6-7)
  ✓ Invoices (CRUD + PDF + public link)
  ✓ Razorpay payment links
  ✓ WhatsApp invoice sharing
  ✓ Tasks (Kanban + recurring)

PHASE 3 — Agentic Layer (Weeks 8-10)
  ✓ AI Assistant (Claude integration)
  ✓ Booking Agent (confirmations + reminders)
  ✓ Invoice Agent (generation + overdue)
  ✓ Client Agent (health score + churn)
  ✓ Digest Agent (morning brief)
  ✓ Agent Actions Log (audit trail)

PHASE 4 — Public Presence + Polish (Weeks 11-12)
  ✓ Public page builder (basic blocks)
  ✓ Public booking widget
  ✓ Hindi localization (i18next)
  ✓ Simple Mode wizards (booking + client + invoice)
  ✓ Mobile bottom nav + FAB
  ✓ Loading skeletons + error states
  ✓ Framer Motion polish pass (all transitions)

PHASE 5 — Launch Prep (Week 13)
  ✓ Security audit (RLS check, CSP, OWASP)
  ✓ Performance audit (Lighthouse, Core Web Vitals)
  ✓ E2E test coverage (critical paths)
  ✓ Staging → Production migration
  ✓ Uptime monitoring live
  ✓ Sentry production configured
  ✓ 5 beta testers onboarded (dog trainer, tailor, photographer, yoga, farmer)
```

---

### Cost Estimate (MVP Infrastructure)

```
Supabase Pro:        $25/month
Vercel Pro:          $20/month
Cloudflare Pro:      $20/month
Upstash Redis:       $10/month (pay-per-use)
Anthropic API:       ~$50-100/month (depending on usage)
SendGrid:            $0/month (free tier: 100 emails/day)
Razorpay:            0% platform fee (they take transaction %)
Sentry:              $0/month (free tier)
PostHog:             $0/month (free tier)
Uptime Robot:        $0/month (free tier)

TOTAL:               ~$125-175/month
Break-even:          3 paying customers at ₹5000/month
```

---

*NicheFlow is not just software. It is the silent co-founder every small business owner in India deserves — one that never sleeps, never forgets, and always has the right answer in their language.*

---

**Document Version:** 1.0 — MVP Blueprint
**Author:** NicheFlow Architecture Team
**Last Updated:** June 2026
