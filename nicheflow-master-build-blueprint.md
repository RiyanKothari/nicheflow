# NicheFlow — Master Build Blueprint
## Complete Agent, Feature & UI Specification for AI-Powered Terminal-Native Coding Agents

> **READ THIS FIRST:** This document is the single source of truth for building NicheFlow.
> Every agent, every UI component, every API route, every database table, every environment variable,
> every file path, and every dependency is specified here. An AI coding agent should be able to
> build the entire system from this document alone without asking any clarifying questions.

---

## QUICK REFERENCE — WHAT TO BUILD

```
MONOREPO ROOT: nicheflow/
├── apps/
│   ├── web/          ← React 18 + Vite 5 (main app)
│   └── public/       ← Next.js 14 (public pages /p/:slug, /invoice/:token)
├── packages/
│   ├── ui/           ← Shared component library
│   ├── agents/       ← Agent logic shared across Edge Functions
│   ├── types/        ← Shared TypeScript types
│   └── utils/        ← Shared utilities
├── supabase/
│   ├── migrations/   ← All DB migrations (sequential, timestamped)
│   ├── functions/    ← Edge Functions (Deno)
│   └── seed.sql      ← Seed data for development
├── .github/
│   └── workflows/    ← CI/CD pipelines
└── docs/             ← Architecture docs
```

---

## TABLE OF CONTENTS

**PART 1 — REPOSITORY & ENVIRONMENT SETUP**
1. [Monorepo Initialization](#1-monorepo-initialization)
2. [Environment Variables — Complete List](#2-environment-variables--complete-list)
3. [Package Dependencies — Complete List](#3-package-dependencies--complete-list)

**PART 2 — DATABASE FOUNDATION**
4. [Complete Database Schema — All Migrations](#4-complete-database-schema--all-migrations)
5. [Row Level Security — All Policies](#5-row-level-security--all-policies)
6. [Database Functions & Triggers](#6-database-functions--triggers)

**PART 3 — AGENT MASTER BLUEPRINTS**
7. [Agent 0 — Orchestrator (NicheFlow Brain)](#7-agent-0--orchestrator-nicheflow-brain)
8. [Agent 1 — Digest Agent](#8-agent-1--digest-agent)
9. [Agent 2 — Booking Agent](#9-agent-2--booking-agent)
10. [Agent 3 — Invoice Agent](#10-agent-3--invoice-agent)
11. [Agent 4 — Client Agent](#11-agent-4--client-agent)
12. [Agent 5 — Inventory Agent](#12-agent-5--inventory-agent)
13. [Agent 6 — Task Agent](#13-agent-6--task-agent)
14. [Agent 7 — WhatsApp Agent](#14-agent-7--whatsapp-agent)
15. [Agent 8 — SEO & Public Page Agent](#15-agent-8--seo--public-page-agent)
16. [Agent 9 — AI Assistant (Floating Chat)](#16-agent-9--ai-assistant-floating-chat)
17. [Agent 10 — Notification Agent](#17-agent-10--notification-agent)

**PART 4 — BACKEND API ROUTES**
18. [Edge Functions — Complete Route Map](#18-edge-functions--complete-route-map)
19. [Webhook Handlers](#19-webhook-handlers)

**PART 5 — FRONTEND ARCHITECTURE**
20. [File Structure — apps/web/](#20-file-structure--appsweb)
21. [Design System Implementation](#21-design-system-implementation)
22. [Routing Architecture](#22-routing-architecture)
23. [Global State & Data Fetching](#23-global-state--data-fetching)

**PART 6 — FEATURE UI BLUEPRINTS**
24. [Onboarding Wizard](#24-onboarding-wizard)
25. [Dashboard Module](#25-dashboard-module)
26. [Bookings Module](#26-bookings-module)
27. [Clients & Notes Module](#27-clients--notes-module)
28. [Invoices Module](#28-invoices-module)
29. [Inventory Module](#29-inventory-module)
30. [Tasks Module](#30-tasks-module)
31. [Public Presence Module](#31-public-presence-module)
32. [Settings Module](#32-settings-module)
33. [Command Palette](#33-command-palette)
34. [AI Assistant (Floating)](#34-ai-assistant-floating)
35. [Simple Mode Wizards](#35-simple-mode-wizards)
36. [Mobile Navigation](#36-mobile-navigation)

**PART 7 — PUBLIC APPS (Next.js)**
37. [Public Business Page /p/:slug](#37-public-business-page-pslug)
38. [Public Invoice /invoice/:token](#38-public-invoice-invoicetoken)
39. [Public Booking Widget](#39-public-booking-widget)

**PART 8 — INFRASTRUCTURE CODE**
40. [Supabase Client Setup](#40-supabase-client-setup)
41. [Auth Implementation](#41-auth-implementation)
42. [Rate Limiting Middleware](#42-rate-limiting-middleware)
43. [PDF Generation Service](#43-pdf-generation-service)
44. [i18n Configuration](#44-i18n-configuration)

**PART 9 — TESTING & DEPLOYMENT**
45. [Test Strategy & Files](#45-test-strategy--files)
46. [CI/CD Pipeline Files](#46-cicd-pipeline-files)
47. [Deployment Checklist](#47-deployment-checklist)

---

# PART 1 — REPOSITORY & ENVIRONMENT SETUP

## 1. Monorepo Initialization

```bash
# Terminal commands — run in order

# 1. Create monorepo with pnpm workspaces
mkdir nicheflow && cd nicheflow
pnpm init

# 2. Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
  - 'supabase/functions/*'
EOF

# 3. Create apps
pnpm create vite apps/web --template react-ts
cd apps/web && pnpm install && cd ../..

# Create Next.js public app
pnpm create next-app apps/public --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# 4. Create packages
mkdir -p packages/ui packages/agents packages/types packages/utils
for pkg in ui agents types utils; do
  cd packages/$pkg && pnpm init && cd ../..
done

# 5. Create Supabase structure
mkdir -p supabase/migrations supabase/functions supabase/seeds

# 6. Initialize Supabase
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# 7. Root package.json scripts
cat > package.json << 'EOF'
{
  "name": "nicheflow",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "dev:public": "pnpm --filter public dev",
    "build": "pnpm --filter web build && pnpm --filter public build",
    "test": "pnpm --filter web test",
    "test:e2e": "playwright test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "db:migrate": "supabase db push",
    "db:reset": "supabase db reset",
    "functions:deploy": "supabase functions deploy"
  }
}
EOF
```

---

## 2. Environment Variables — Complete List

### apps/web/.env.local
```env
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# App Config
VITE_APP_URL=http://localhost:5173
VITE_PUBLIC_APP_URL=http://localhost:3000
VITE_ENVIRONMENT=development

# PostHog (optional analytics)
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://app.posthog.com

# Sentry
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### apps/public/.env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

### supabase/.env (for local dev — never commit)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Supabase Vault Secrets (set via CLI or dashboard — never in .env)
```bash
# Run these once per project
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set META_WHATSAPP_TOKEN=EAAG...
supabase secrets set META_WHATSAPP_PHONE_ID=123456789
supabase secrets set META_WHATSAPP_BUSINESS_ID=987654321
supabase secrets set META_VERIFY_TOKEN=nicheflow_verify_2024
supabase secrets set RAZORPAY_KEY_ID=rzp_live_...
supabase secrets set RAZORPAY_KEY_SECRET=...
supabase secrets set SENDGRID_API_KEY=SG....
supabase secrets set UPSTASH_REDIS_URL=https://...upstash.io
supabase secrets set UPSTASH_REDIS_TOKEN=...
supabase secrets set CLOUDFLARE_ZONE_ID=...
supabase secrets set CLOUDFLARE_API_TOKEN=...
supabase secrets set BROWSERLESS_TOKEN=...  # for PDF generation
```

---

## 3. Package Dependencies — Complete List

### apps/web/package.json
```json
{
  "name": "@nicheflow/web",
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@fullcalendar/core": "^6.1.11",
    "@fullcalendar/daygrid": "^6.1.11",
    "@fullcalendar/interaction": "^6.1.11",
    "@fullcalendar/react": "^6.1.11",
    "@fullcalendar/timegrid": "^6.1.11",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@supabase/supabase-js": "^2.43.0",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-table": "^8.17.3",
    "@tiptap/extension-placeholder": "^2.4.0",
    "@tiptap/pm": "^2.4.0",
    "@tiptap/react": "^2.4.0",
    "@tiptap/starter-kit": "^2.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "framer-motion": "^11.2.12",
    "fuse.js": "^7.0.0",
    "i18next": "^23.11.5",
    "i18next-browser-languagedetector": "^8.0.0",
    "lucide-react": "^0.383.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.52.0",
    "react-i18next": "^14.1.2",
    "react-router-dom": "^6.23.1",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@sentry/vite-plugin": "^2.19.0",
    "@testing-library/jest-dom": "^6.4.5",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.6.0"
  }
}
```

### supabase/functions/package.json (shared for all Edge Functions)
```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2.43.0",
    "@anthropic-ai/sdk": "https://esm.sh/@anthropic-ai/sdk@0.24.0",
    "zod": "https://esm.sh/zod@3.23.8",
    "@upstash/ratelimit": "https://esm.sh/@upstash/ratelimit@1.2.1",
    "@upstash/redis": "https://esm.sh/@upstash/redis@1.31.0"
  }
}
```

---

# PART 2 — DATABASE FOUNDATION

## 4. Complete Database Schema — All Migrations

### Migration 001 — Extensions
```sql
-- supabase/migrations/20240001000000_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "moddatetime";
CREATE EXTENSION IF NOT EXISTS "pgmq";
```

### Migration 002 — Workspaces & Users
```sql
-- supabase/migrations/20240001000001_workspaces.sql

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN (
    'dog_trainer','tailor','photographer','urban_farmer',
    'yoga_studio','salon','tutor','caterer','event_planner','other'
  )),
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  address JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en' CHECK (language IN ('en','hi','mr','ta','te','bn')),
  currency TEXT DEFAULT 'INR',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  agent_autonomy TEXT DEFAULT 'balanced' CHECK (agent_autonomy IN ('conservative','balanced','autonomous')),
  working_hours JSONB DEFAULT '{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"10:00","close":"14:00"},"sun":null}',
  holidays JSONB DEFAULT '[]',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','starter','pro','team')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner','admin','staff','viewer')),
  display_name TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Auto-update updated_at
CREATE TRIGGER workspaces_moddatetime
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Helper function for current workspace (set by auth middleware)
CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS UUID LANGUAGE SQL STABLE AS $$
  SELECT NULLIF(current_setting('app.workspace_id', TRUE), '')::UUID;
$$;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT role FROM workspace_members
  WHERE workspace_id = current_workspace_id()
  AND user_id = auth.uid()
  LIMIT 1;
$$;
```

### Migration 003 — Clients
```sql
-- supabase/migrations/20240001000002_clients.sql

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  phone_e164 TEXT GENERATED ALWAYS AS (
    CASE WHEN phone IS NOT NULL AND phone NOT LIKE '+%'
    THEN '+91' || regexp_replace(phone, '[^0-9]', '', 'g')
    ELSE phone END
  ) STORED,
  email TEXT,
  date_of_birth DATE,
  anniversary_date DATE,
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  health_score INTEGER DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  referral_source TEXT,
  referred_by UUID REFERENCES clients(id),
  notes_count INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_workspace ON clients(workspace_id);
CREATE INDEX idx_clients_name_trgm ON clients USING GIN (name gin_trgm_ops);
CREATE INDEX idx_clients_phone ON clients(workspace_id, phone);
CREATE INDEX idx_clients_tags ON clients USING GIN (tags);
CREATE INDEX idx_clients_embedding ON clients USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TRIGGER clients_moddatetime
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TABLE client_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking','invoice','note','message','review','call')),
  reference_id UUID,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_client ON client_interactions(client_id, created_at DESC);
```

### Migration 004 — Services
```sql
-- supabase/migrations/20240001000003_services.sql

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  buffer_minutes INTEGER DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_type TEXT DEFAULT 'fixed' CHECK (price_type IN ('fixed','hourly','custom')),
  category TEXT,
  color TEXT DEFAULT '#F97316',
  is_active BOOLEAN DEFAULT TRUE,
  max_participants INTEGER DEFAULT 1,
  requires_deposit BOOLEAN DEFAULT FALSE,
  deposit_amount NUMERIC(10,2),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_workspace ON services(workspace_id, is_active);

CREATE TRIGGER services_moddatetime
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### Migration 005 — Bookings
```sql
-- supabase/migrations/20240001000004_bookings.sql

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'pending','confirmed','in_progress','completed','cancelled','no_show'
  )),
  location TEXT,
  price NUMERIC(10,2),
  notes TEXT,
  internal_notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual','public_widget','ai','import')),
  recurrence_id UUID,
  recurrence_rule JSONB,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_2h_sent BOOLEAN DEFAULT FALSE,
  confirmation_sent BOOLEAN DEFAULT FALSE,
  review_requested BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_overlap EXCLUDE USING GIST (
    workspace_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled','no_show'))
);

CREATE INDEX idx_bookings_workspace_time ON bookings(workspace_id, start_time);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_status ON bookings(workspace_id, status);
CREATE INDEX idx_bookings_reminders ON bookings(start_time, reminder_24h_sent, reminder_2h_sent)
  WHERE status = 'confirmed';

CREATE TRIGGER bookings_moddatetime
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Trigger: update client stats on booking status change
CREATE OR REPLACE FUNCTION update_client_on_booking()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE clients SET
      total_bookings = total_bookings + 1,
      last_interaction_at = NOW()
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_status_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_client_on_booking();
```

### Migration 006 — Invoices & Payments
```sql
-- supabase/migrations/20240001000005_invoices.sql

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','sent','viewed','partial','paid','overdue','cancelled','refunded'
  )),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('fixed','percent')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  amount_due NUMERIC(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  terms TEXT,
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  pdf_url TEXT,
  reminder_3d_sent BOOLEAN DEFAULT FALSE,
  reminder_7d_sent BOOLEAN DEFAULT FALSE,
  reminder_14d_sent BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, invoice_number)
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT CHECK (method IN ('cash','upi','bank_transfer','card','razorpay','cheque','other')),
  reference TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_workspace ON invoices(workspace_id, status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_due ON invoices(due_date, status) WHERE status IN ('sent','partial');
CREATE INDEX idx_invoices_token ON invoices(public_token);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

CREATE TRIGGER invoices_moddatetime
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_workspace_id UUID)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_year TEXT;
BEGIN
  v_year := to_char(NOW(), 'YY');
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices WHERE workspace_id = p_workspace_id
  AND extract(year FROM created_at) = extract(year FROM NOW());
  RETURN 'INV-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
END;
$$;

-- Update invoice totals on item change
CREATE OR REPLACE FUNCTION recalculate_invoice_total()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_invoice invoices;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  UPDATE invoices SET
    subtotal = (SELECT COALESCE(SUM(amount), 0) FROM invoice_items WHERE invoice_id = v_invoice.id),
    tax_amount = subtotal * (tax_rate / 100),
    total = subtotal + tax_amount - discount_amount
  WHERE id = v_invoice.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoice_items_total_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION recalculate_invoice_total();
```

### Migration 007 — Inventory
```sql
-- supabase/migrations/20240001000006_inventory.sql

CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  unit TEXT DEFAULT 'piece',
  current_stock NUMERIC(12,3) DEFAULT 0,
  reorder_threshold NUMERIC(12,3) DEFAULT 5,
  cost_price NUMERIC(10,2),
  selling_price NUMERIC(10,2),
  supplier_name TEXT,
  supplier_phone TEXT,
  expiry_date DATE,
  is_perishable BOOLEAN DEFAULT FALSE,
  barcode TEXT,
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in','out','adjustment','waste','return')),
  quantity NUMERIC(12,3) NOT NULL,
  balance_after NUMERIC(12,3) NOT NULL,
  unit_cost NUMERIC(10,2),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_workspace ON inventory_items(workspace_id, is_active);
CREATE INDEX idx_inventory_reorder ON inventory_items(workspace_id, current_stock, reorder_threshold)
  WHERE is_active = TRUE;
CREATE INDEX idx_movements_item ON inventory_movements(item_id, created_at DESC);

CREATE TRIGGER inventory_moddatetime
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Auto-update stock on movement
CREATE OR REPLACE FUNCTION update_stock_on_movement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE inventory_items SET
    current_stock = CASE
      WHEN NEW.type IN ('in','return') THEN current_stock + NEW.quantity
      WHEN NEW.type IN ('out','waste') THEN current_stock - NEW.quantity
      WHEN NEW.type = 'adjustment' THEN NEW.quantity
    END
  WHERE id = NEW.item_id;
  NEW.balance_after = (SELECT current_stock FROM inventory_items WHERE id = NEW.item_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER stock_movement_trigger
  BEFORE INSERT ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION update_stock_on_movement();
```

### Migration 008 — Tasks
```sql
-- supabase/migrations/20240001000007_tasks.sql

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent','high','normal','low')),
  due_date TIMESTAMPTZ,
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  assignee_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB,
  recurrence_parent_id UUID REFERENCES tasks(id),
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_workspace ON tasks(workspace_id, status);
CREATE INDEX idx_tasks_due ON tasks(workspace_id, due_date) WHERE status != 'done';
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status);

CREATE TRIGGER tasks_moddatetime
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### Migration 009 — Notes
```sql
-- supabase/migrations/20240001000008_notes.sql

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  content_html TEXT,
  is_voice BOOLEAN DEFAULT FALSE,
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_action_items JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_client ON notes(client_id, created_at DESC);
```

### Migration 010 — Agent System
```sql
-- supabase/migrations/20240001000009_agents.sql

CREATE TABLE agent_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','running','completed','failed','skipped','awaiting_approval')),
  user_approved BOOLEAN,
  user_override_reason TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  agent_action_id UUID REFERENCES agent_actions_log(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_log_workspace ON agent_actions_log(workspace_id, created_at DESC);
CREATE INDEX idx_agent_queue_pending ON agent_queue(scheduled_at, attempts)
  WHERE completed_at IS NULL AND failed_at IS NULL;
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

### Migration 011 — Public Pages & Reviews
```sql
-- supabase/migrations/20240001000010_public.sql

CREATE TABLE public_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT,
  blocks JSONB DEFAULT '[]',
  published BOOLEAN DEFAULT FALSE,
  custom_domain TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  theme JSONB DEFAULT '{"colorScheme":"light","accentColor":"#F97316"}',
  settings JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  bookings_from_page INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  public_page_id UUID REFERENCES public_pages(id) ON DELETE CASCADE,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  owner_reply TEXT,
  owner_reply_draft TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  review_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_workspace ON reviews(workspace_id, is_published);
CREATE INDEX idx_reviews_token ON reviews(review_token);
```

### Migration 012 — Cron Jobs
```sql
-- supabase/migrations/20240001000011_crons.sql
-- Note: pg_cron jobs call Edge Functions via HTTP

SELECT cron.schedule('digest-agent', '50 1 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/digest-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{}')$$
);

SELECT cron.schedule('reminder-check', '*/5 * * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/booking-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"check_reminders"}')$$
);

SELECT cron.schedule('invoice-overdue-check', '0 9 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/invoice-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"check_overdue"}')$$
);

SELECT cron.schedule('client-health-score', '0 2 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/client-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"recalculate_health_scores"}')$$
);

SELECT cron.schedule('birthday-check', '0 5 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/client-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"check_birthdays"}')$$
);

SELECT cron.schedule('inventory-check', '0 8 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/inventory-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"daily_check"}')$$
);

SELECT cron.schedule('recurring-tasks', '0 0 * * *',
  $$SELECT net.http_post(url:='https://YOUR_PROJECT.supabase.co/functions/v1/task-agent',
    headers:='{"Authorization":"Bearer ' || current_setting('app.service_role_key') || '"}',
    body:='{"job":"generate_recurring"}')$$
);

SELECT cron.schedule('refresh-materialized-views', '*/15 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_daily$$
);
```

### Migration 013 — Materialized Views
```sql
-- supabase/migrations/20240001000012_materialized_views.sql

CREATE MATERIALIZED VIEW mv_revenue_daily AS
SELECT
  workspace_id,
  DATE(paid_at) as date,
  SUM(amount) as revenue,
  COUNT(*) as payment_count
FROM payments
GROUP BY workspace_id, DATE(paid_at);

CREATE UNIQUE INDEX ON mv_revenue_daily(workspace_id, date);

CREATE MATERIALIZED VIEW mv_client_health AS
SELECT
  c.id as client_id,
  c.workspace_id,
  LEAST(100, GREATEST(0,
    (CASE WHEN c.last_interaction_at > NOW() - INTERVAL '30 days' THEN 40 ELSE 0 END) +
    (CASE WHEN c.total_bookings > 5 THEN 30 ELSE c.total_bookings * 6 END) +
    (CASE WHEN c.total_revenue > 10000 THEN 30 ELSE (c.total_revenue / 10000 * 30)::INTEGER END)
  )) as health_score
FROM clients c;

CREATE UNIQUE INDEX ON mv_client_health(client_id);
```

---

## 5. Row Level Security — All Policies

```sql
-- supabase/migrations/20240001000013_rls.sql

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- WORKSPACE POLICIES
CREATE POLICY "users_can_see_their_workspaces" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "owners_can_update_workspace" ON workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM workspace_members
           WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- WORKSPACE MEMBERS POLICIES
CREATE POLICY "members_can_see_their_workspace_members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "owners_manage_members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members
                     WHERE user_id = auth.uid() AND role IN ('owner','admin'))
  );

-- GENERIC WORKSPACE ISOLATION MACRO (applied to all data tables)
-- Pattern: SELECT for all members, INSERT/UPDATE for staff+, DELETE for admin+

DO $$ DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['clients','services','bookings','invoices','inventory_items',
                              'inventory_movements','tasks','notes','agent_actions_log','notifications'] LOOP
    EXECUTE format(
      'CREATE POLICY "%s_workspace_select" ON %s FOR SELECT
       USING (workspace_id = current_workspace_id())',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_workspace_insert" ON %s FOR INSERT
       WITH CHECK (workspace_id = current_workspace_id()
         AND current_user_role() IN (''owner'',''admin'',''staff''))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_workspace_update" ON %s FOR UPDATE
       USING (workspace_id = current_workspace_id()
         AND current_user_role() IN (''owner'',''admin'',''staff''))',
      tbl, tbl
    );
    EXECUTE format(
      'CREATE POLICY "%s_workspace_delete" ON %s FOR DELETE
       USING (workspace_id = current_workspace_id()
         AND current_user_role() IN (''owner'',''admin''))',
      tbl, tbl
    );
  END LOOP;
END $$;

-- PUBLIC PAGES — readable by everyone, writable by workspace members
CREATE POLICY "public_pages_public_read" ON public_pages
  FOR SELECT USING (published = TRUE OR workspace_id = current_workspace_id());

CREATE POLICY "public_pages_member_write" ON public_pages
  FOR ALL USING (workspace_id = current_workspace_id()
    AND current_user_role() IN ('owner','admin'));

-- REVIEWS — public read for published reviews
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT USING (is_published = TRUE OR workspace_id = current_workspace_id());

CREATE POLICY "reviews_member_write" ON reviews
  FOR ALL USING (workspace_id = current_workspace_id());
```

---

## 6. Database Functions & Triggers

```sql
-- supabase/migrations/20240001000014_functions.sql

-- Set workspace context (called by Edge Functions / middleware)
CREATE OR REPLACE FUNCTION set_workspace_context(p_workspace_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('app.workspace_id', p_workspace_id::TEXT, TRUE);
END;
$$;

-- Get today's business summary for AI context
CREATE OR REPLACE FUNCTION get_business_summary(p_workspace_id UUID)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'bookings_today', (SELECT COUNT(*) FROM bookings
      WHERE workspace_id = p_workspace_id
      AND start_time::DATE = CURRENT_DATE
      AND status = 'confirmed'),
    'revenue_mtd', (SELECT COALESCE(SUM(amount), 0) FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.workspace_id = p_workspace_id
      AND DATE_TRUNC('month', p.paid_at) = DATE_TRUNC('month', NOW())),
    'tasks_overdue', (SELECT COUNT(*) FROM tasks
      WHERE workspace_id = p_workspace_id
      AND due_date < NOW() AND status != 'done'),
    'clients_total', (SELECT COUNT(*) FROM clients WHERE workspace_id = p_workspace_id),
    'invoices_unpaid', (SELECT COALESCE(SUM(amount_due), 0) FROM invoices
      WHERE workspace_id = p_workspace_id AND status IN ('sent','partial','overdue')),
    'inventory_alerts', (SELECT COUNT(*) FROM inventory_items
      WHERE workspace_id = p_workspace_id
      AND current_stock <= reorder_threshold AND is_active)
  ) INTO result;
  RETURN result;
END;
$$;
```

---

# PART 3 — AGENT MASTER BLUEPRINTS

## 7. Agent 0 — Orchestrator (NicheFlow Brain)

### File: `supabase/functions/orchestrator/index.ts`

```typescript
// supabase/functions/orchestrator/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_booking',
    description: 'Create a new booking for a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        service_id: { type: 'string' },
        start_time: { type: 'string', description: 'ISO 8601 datetime' },
        notes: { type: 'string' }
      },
      required: ['client_id', 'service_id', 'start_time']
    }
  },
  {
    name: 'search_clients',
    description: 'Search for clients by name or phone',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  },
  {
    name: 'create_invoice',
    description: 'Create an invoice for a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' }
            }
          }
        },
        due_date: { type: 'string' }
      },
      required: ['client_id', 'items']
    }
  },
  {
    name: 'get_today_schedule',
    description: 'Get all bookings for today',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_task',
    description: 'Create a new task',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        due_date: { type: 'string' },
        priority: { type: 'string', enum: ['urgent','high','normal','low'] },
        client_id: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'get_revenue_summary',
    description: 'Get revenue summary for a period',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today','week','month','year'] }
      },
      required: ['period']
    }
  },
  {
    name: 'check_inventory',
    description: 'Check current inventory levels',
    input_schema: {
      type: 'object',
      properties: { item_name: { type: 'string' } }
    }
  },
  {
    name: 'send_whatsapp_message',
    description: 'Send a WhatsApp message to a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['client_id', 'message']
    }
  },
  {
    name: 'get_client_profile',
    description: 'Get detailed profile of a client',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id']
    }
  },
  {
    name: 'update_booking_status',
    description: 'Update the status of a booking',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: { type: 'string' },
        status: { type: 'string', enum: ['confirmed','completed','cancelled','no_show'] }
      },
      required: ['booking_id', 'status']
    }
  }
]

async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  workspaceId: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'get_today_schedule': {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase
          .from('bookings')
          .select('*, clients(name, phone), services(name)')
          .eq('workspace_id', workspaceId)
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`)
          .order('start_time')
        return JSON.stringify(data || [])
      }
      case 'search_clients': {
        const { data } = await supabase
          .from('clients')
          .select('id, name, phone, email, health_score, total_bookings')
          .eq('workspace_id', workspaceId)
          .ilike('name', `%${toolInput.query}%`)
          .limit(5)
        return JSON.stringify(data || [])
      }
      case 'get_revenue_summary': {
        const periods: Record<string, string> = {
          today: "DATE_TRUNC('day', NOW())",
          week: "DATE_TRUNC('week', NOW())",
          month: "DATE_TRUNC('month', NOW())",
          year: "DATE_TRUNC('year', NOW())"
        }
        const { data } = await supabase.rpc('get_business_summary', {
          p_workspace_id: workspaceId
        })
        return JSON.stringify(data || {})
      }
      case 'create_task': {
        const { data } = await supabase
          .from('tasks')
          .insert({
            workspace_id: workspaceId,
            title: toolInput.title,
            due_date: toolInput.due_date,
            priority: toolInput.priority || 'normal',
            client_id: toolInput.client_id || null
          })
          .select()
          .single()
        return JSON.stringify({ success: true, task: data })
      }
      case 'create_booking': {
        const { data: service } = await supabase
          .from('services')
          .select('duration_minutes, price')
          .eq('id', toolInput.service_id)
          .single()
        const startTime = new Date(toolInput.start_time as string)
        const endTime = new Date(startTime.getTime() + (service?.duration_minutes || 60) * 60000)
        const { data } = await supabase
          .from('bookings')
          .insert({
            workspace_id: workspaceId,
            client_id: toolInput.client_id,
            service_id: toolInput.service_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            price: service?.price,
            notes: toolInput.notes,
            source: 'ai'
          })
          .select('*, clients(name), services(name)')
          .single()
        return JSON.stringify({ success: true, booking: data })
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` })
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) })
  }
}

Deno.serve(async (req) => {
  const { message, workspaceId, conversationHistory = [], language = 'en' } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  // Get business context
  const { data: summary } = await supabase.rpc('get_business_summary', {
    p_workspace_id: workspaceId
  })
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name, business_type, language, agent_autonomy')
    .eq('id', workspaceId)
    .single()

  const systemPrompt = `You are NicheFlow Brain — the AI assistant for ${workspace?.name}, 
a ${workspace?.business_type} business in India.

Current business snapshot:
- Bookings today: ${summary?.bookings_today || 0}
- Revenue this month: ₹${summary?.revenue_mtd || 0}
- Overdue tasks: ${summary?.tasks_overdue || 0}
- Unpaid invoices: ₹${summary?.invoices_unpaid || 0}
- Inventory alerts: ${summary?.inventory_alerts || 0}

Autonomy level: ${workspace?.agent_autonomy}
Today: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
Be concise, practical, and action-oriented. You have tools to take real actions.
Always confirm destructive actions. Log every action you take.`

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: 'user', content: message }
  ]

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    tools: AGENT_TOOLS,
    messages
  })

  const toolResults: Anthropic.ToolResultBlockParam[] = []

  // Agentic loop — keep processing until no more tool calls
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')

    for (const toolUse of toolUseBlocks) {
      if (toolUse.type !== 'tool_use') continue
      const result = await executeToolCall(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        supabase,
        workspaceId
      )

      // Log agent action
      await supabase.from('agent_actions_log').insert({
        workspace_id: workspaceId,
        agent_id: 'ai_assistant',
        action_type: toolUse.name,
        description: `AI executed: ${toolUse.name}`,
        payload: toolUse.input,
        result: JSON.parse(result),
        status: 'completed'
      })

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result
      })
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools: AGENT_TOOLS,
      messages
    })
  }

  const textContent = response.content.find(b => b.type === 'text')
  return new Response(
    JSON.stringify({
      reply: textContent?.type === 'text' ? textContent.text : '',
      updatedHistory: messages
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## 8. Agent 1 — Digest Agent

### File: `supabase/functions/digest-agent/index.ts`

**Trigger:** pg_cron at 6:50 AM IST daily (1:20 AM UTC)
**Purpose:** Generate personalized morning business brief for each workspace

```typescript
// supabase/functions/digest-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  // Get all active workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, business_type, language')
    .eq('onboarding_completed', true)

  for (const workspace of workspaces || []) {
    try {
      const { data: summary } = await supabase.rpc('get_business_summary', {
        p_workspace_id: workspace.id
      })

      // Get today's bookings
      const today = new Date().toISOString().split('T')[0]
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('start_time, title, clients(name), services(name)')
        .eq('workspace_id', workspace.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .eq('status', 'confirmed')
        .order('start_time')

      // Get overdue tasks
      const { data: overdueTasks } = await supabase
        .from('tasks')
        .select('title, due_date, priority')
        .eq('workspace_id', workspace.id)
        .lt('due_date', new Date().toISOString())
        .neq('status', 'done')
        .limit(5)

      const prompt = `Generate a morning business brief for ${workspace.name} (${workspace.business_type}).

Data:
- Today's bookings (${todayBookings?.length || 0}): ${JSON.stringify(todayBookings?.slice(0, 5))}
- Overdue tasks: ${JSON.stringify(overdueTasks)}
- Revenue this month: ₹${summary?.revenue_mtd}
- Unpaid invoices: ₹${summary?.invoices_unpaid}
- Inventory alerts: ${summary?.inventory_alerts}

Write a brief, friendly morning summary in ${workspace.language === 'hi' ? 'Hindi' : 'English'}.
Format: 3-5 bullet points. Start with the most important item.
Tone: Like a smart assistant giving a quick briefing. No fluff.
Keep under 150 words.`

      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })

      const digestText = response.content[0].type === 'text' ? response.content[0].text : ''

      // Store as notification
      await supabase.from('notifications').insert({
        workspace_id: workspace.id,
        type: 'digest',
        title: `Good morning! Here's your ${new Date().toLocaleDateString('en-IN', { weekday: 'long' })} brief`,
        body: digestText
      })

      // Log agent action
      await supabase.from('agent_actions_log').insert({
        workspace_id: workspace.id,
        agent_id: 'digest_agent',
        action_type: 'generate_digest',
        description: 'Generated morning business brief',
        status: 'completed',
        tokens_used: response.usage.input_tokens + response.usage.output_tokens
      })
    } catch (err) {
      console.error(`Digest failed for workspace ${workspace.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 9. Agent 2 — Booking Agent

### File: `supabase/functions/booking-agent/index.ts`

**Triggers:** pg_cron every 5 minutes (reminders), webhook on booking events
**Purpose:** Confirmations, reminders, no-show handling, reschedule suggestions

```typescript
// supabase/functions/booking-agent/index.ts
import { createClient } from '@supabase/supabase-js'

const JOB_HANDLERS: Record<string, Function> = {
  check_reminders: checkAndSendReminders,
  handle_no_show: handleNoShow,
  send_confirmation: sendConfirmation,
  process_cancellation: processCancellation
}

async function checkAndSendReminders(supabase: ReturnType<typeof createClient>) {
  const now = new Date()

  // 24h reminder: bookings starting in 23-25 hours that haven't been reminded
  const h24from = new Date(now.getTime() + 23 * 3600000).toISOString()
  const h24to = new Date(now.getTime() + 25 * 3600000).toISOString()

  const { data: bookings24h } = await supabase
    .from('bookings')
    .select('*, clients(name, phone, phone_e164), services(name), workspaces(name, language)')
    .eq('status', 'confirmed')
    .eq('reminder_24h_sent', false)
    .gte('start_time', h24from)
    .lte('start_time', h24to)

  for (const booking of bookings24h || []) {
    await sendWhatsAppReminder(supabase, booking, '24h')
    await supabase.from('bookings').update({ reminder_24h_sent: true }).eq('id', booking.id)
  }

  // 2h reminder
  const h2from = new Date(now.getTime() + 1.5 * 3600000).toISOString()
  const h2to = new Date(now.getTime() + 2.5 * 3600000).toISOString()

  const { data: bookings2h } = await supabase
    .from('bookings')
    .select('*, clients(name, phone, phone_e164), services(name), workspaces(name, language)')
    .eq('status', 'confirmed')
    .eq('reminder_2h_sent', false)
    .gte('start_time', h2from)
    .lte('start_time', h2to)

  for (const booking of bookings2h || []) {
    await sendWhatsAppReminder(supabase, booking, '2h')
    await supabase.from('bookings').update({ reminder_2h_sent: true }).eq('id', booking.id)
  }

  // No-show check: bookings that ended >30min ago, still 'confirmed', no check-in
  const noShowThreshold = new Date(now.getTime() - 30 * 60000).toISOString()
  const { data: possibleNoShows } = await supabase
    .from('bookings')
    .select('*, clients(name, phone_e164), workspaces(id)')
    .eq('status', 'confirmed')
    .lt('end_time', noShowThreshold)
    .is('checked_in_at', null)

  for (const booking of possibleNoShows || []) {
    await supabase.from('bookings').update({ status: 'no_show' }).eq('id', booking.id)
    await supabase.from('agent_actions_log').insert({
      workspace_id: booking.workspace_id,
      agent_id: 'booking_agent',
      action_type: 'mark_no_show',
      entity_type: 'booking',
      entity_id: booking.id,
      description: `Marked booking for ${booking.clients?.name} as no-show`,
      status: 'completed'
    })
    await supabase.from('notifications').insert({
      workspace_id: booking.workspace_id,
      type: 'no_show',
      title: `No-show: ${booking.clients?.name}`,
      body: `${booking.clients?.name} didn't show up for their ${booking.title} appointment.`,
      action_url: `/bookings/${booking.id}`
    })
  }
}

async function sendWhatsAppReminder(
  supabase: ReturnType<typeof createClient>,
  booking: Record<string, unknown>,
  type: '24h' | '2h'
) {
  const phone = (booking.clients as Record<string, unknown>)?.phone_e164 as string
  if (!phone) return

  const bookingDate = new Date(booking.start_time as string)
  const timeStr = bookingDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = type === '24h'
    ? `tomorrow at ${timeStr}`
    : `in about 2 hours (${timeStr})`

  const message = `Hi ${(booking.clients as Record<string, unknown>)?.name}! 👋\n\nReminder: Your ${(booking.services as Record<string, unknown>)?.name} appointment is ${dateStr}.\n\nLocation: ${booking.location || 'To be confirmed'}\n\nSee you soon! 🙏`

  await supabase.functions.invoke('whatsapp-agent', {
    body: { phone, message, booking_id: booking.id }
  })
}

async function sendConfirmation(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>
) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, clients(name, phone_e164), services(name, price)')
    .eq('id', payload.booking_id)
    .single()

  if (!booking || booking.confirmation_sent) return

  const phone = booking.clients?.phone_e164
  if (!phone) return

  const message = `✅ Booking Confirmed!\n\nHi ${booking.clients?.name}, your ${booking.services?.name} is confirmed.\n\n📅 Date: ${new Date(booking.start_time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ Time: ${new Date(booking.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n💰 Price: ₹${booking.services?.price || 'TBD'}\n\nThank you for booking with us! 🙏`

  await supabase.functions.invoke('whatsapp-agent', { body: { phone, message } })
  await supabase.from('bookings').update({ confirmation_sent: true }).eq('id', booking.id)
}

async function handleNoShow() {} // Handled in check_reminders
async function processCancellation() {}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const handler = JOB_HANDLERS[body.job]
  if (handler) await handler(supabase, body)

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 10. Agent 3 — Invoice Agent

### File: `supabase/functions/invoice-agent/index.ts`

**Triggers:** pg_cron daily 9AM, booking completion webhook
**Purpose:** Auto-generate invoices, overdue reminders, payment reconciliation

```typescript
// supabase/functions/invoice-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function checkOverdueInvoices(supabase: ReturnType<typeof createClient>) {
  const today = new Date()

  // 3-day overdue
  const { data: overdue3d } = await supabase
    .from('invoices')
    .select('*, clients(name, phone_e164, email), workspaces(name)')
    .in('status', ['sent', 'partial'])
    .eq('reminder_3d_sent', false)
    .lte('due_date', new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0])

  for (const invoice of overdue3d || []) {
    await sendOverdueReminder(supabase, invoice, 3)
    await supabase.from('invoices')
      .update({ reminder_3d_sent: true, status: 'overdue' })
      .eq('id', invoice.id)
  }

  // 7-day overdue
  const { data: overdue7d } = await supabase
    .from('invoices')
    .select('*, clients(name, phone_e164), workspaces(name)')
    .in('status', ['sent', 'partial', 'overdue'])
    .eq('reminder_7d_sent', false)
    .lte('due_date', new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0])

  for (const invoice of overdue7d || []) {
    await sendOverdueReminder(supabase, invoice, 7)
    await supabase.from('invoices').update({ reminder_7d_sent: true }).eq('id', invoice.id)
  }

  // 14-day overdue
  const { data: overdue14d } = await supabase
    .from('invoices')
    .select('*, clients(name, phone_e164), workspaces(name)')
    .in('status', ['sent', 'partial', 'overdue'])
    .eq('reminder_14d_sent', false)
    .lte('due_date', new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0])

  for (const invoice of overdue14d || []) {
    await sendOverdueReminder(supabase, invoice, 14)
    await supabase.from('invoices').update({ reminder_14d_sent: true }).eq('id', invoice.id)
  }
}

async function sendOverdueReminder(
  supabase: ReturnType<typeof createClient>,
  invoice: Record<string, unknown>,
  days: number
) {
  const client = invoice.clients as Record<string, unknown>
  const workspace = invoice.workspaces as Record<string, unknown>
  const phone = client?.phone_e164 as string

  const tones: Record<number, string> = {
    3: `Hi ${client?.name}! 😊 Just a friendly reminder that invoice #${invoice.invoice_number} for ₹${invoice.amount_due} was due ${days} days ago. Please pay at your earliest convenience. Payment link: ${process.env.VITE_APP_URL}/invoice/${invoice.public_token}`,
    7: `Dear ${client?.name}, This is a reminder that invoice #${invoice.invoice_number} (₹${invoice.amount_due}) is now 7 days overdue. Please clear the payment to avoid any inconvenience. Pay here: ${process.env.VITE_APP_URL}/invoice/${invoice.public_token}`,
    14: `Dear ${client?.name}, Invoice #${invoice.invoice_number} for ₹${invoice.amount_due} is now 14 days overdue. This is our final reminder. Please settle immediately. Pay: ${process.env.VITE_APP_URL}/invoice/${invoice.public_token} — ${workspace?.name} Team`
  }

  if (phone && tones[days]) {
    await supabase.functions.invoke('whatsapp-agent', {
      body: { phone, message: tones[days] }
    })
  }

  await supabase.from('agent_actions_log').insert({
    workspace_id: invoice.workspace_id,
    agent_id: 'invoice_agent',
    action_type: 'overdue_reminder',
    entity_type: 'invoice',
    entity_id: invoice.id,
    description: `Sent ${days}-day overdue reminder to ${client?.name} for invoice #${invoice.invoice_number}`,
    status: 'completed'
  })
}

async function generateInvoiceFromBooking(
  supabase: ReturnType<typeof createClient>,
  bookingId: string
) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, clients(*), services(*), workspaces(*)')
    .eq('id', bookingId)
    .single()

  if (!booking || !booking.clients) return

  const invoiceNumber = await supabase.rpc('generate_invoice_number', {
    p_workspace_id: booking.workspace_id
  })

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      workspace_id: booking.workspace_id,
      client_id: booking.client_id,
      booking_id: booking.id,
      invoice_number: invoiceNumber.data,
      status: 'draft',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    })
    .select()
    .single()

  if (invoice) {
    await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      description: booking.services?.name || booking.title,
      quantity: 1,
      unit_price: booking.price || booking.services?.price || 0
    })

    await supabase.from('agent_actions_log').insert({
      workspace_id: booking.workspace_id,
      agent_id: 'invoice_agent',
      action_type: 'auto_generate_invoice',
      entity_type: 'invoice',
      entity_id: invoice.id,
      description: `Auto-generated draft invoice #${invoiceNumber.data} for ${booking.clients.name}`,
      status: 'completed'
    })

    // Notify owner
    await supabase.from('notifications').insert({
      workspace_id: booking.workspace_id,
      type: 'invoice_generated',
      title: `Invoice drafted for ${booking.clients.name}`,
      body: `Invoice #${invoiceNumber.data} (₹${booking.price || booking.services?.price || 0}) is ready to send.`,
      action_url: `/invoices/${invoice.id}`
    })
  }
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (body.job === 'check_overdue') await checkOverdueInvoices(supabase)
  if (body.job === 'generate_from_booking') await generateInvoiceFromBooking(supabase, body.booking_id)

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 11. Agent 4 — Client Agent

### File: `supabase/functions/client-agent/index.ts`

**Triggers:** pg_cron daily, note save webhook
**Purpose:** Health scores, churn detection, birthdays, note summarization

```typescript
// supabase/functions/client-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function recalculateHealthScores(supabase: ReturnType<typeof createClient>) {
  // Refresh materialized view (fast)
  await supabase.rpc('exec', { sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_health' })

  // Update clients table from materialized view
  await supabase.rpc('exec', {
    sql: `UPDATE clients c SET health_score = mv.health_score
          FROM mv_client_health mv WHERE c.id = mv.client_id`
  })

  // Flag churn-risk clients (health_score < 30, last interaction > 45 days)
  const { data: churnRisk } = await supabase
    .from('clients')
    .select('id, name, workspace_id, phone_e164, last_interaction_at')
    .lt('health_score', 30)
    .lt('last_interaction_at', new Date(Date.now() - 45 * 86400000).toISOString())

  for (const client of churnRisk || []) {
    await supabase.from('notifications').insert({
      workspace_id: client.workspace_id,
      type: 'churn_risk',
      title: `${client.name} may be drifting away`,
      body: `${client.name} hasn't interacted in over 45 days. Consider reaching out.`,
      action_url: `/clients/${client.id}`
    })
  }
}

async function checkBirthdays(supabase: ReturnType<typeof createClient>) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const month = tomorrow.getMonth() + 1
  const day = tomorrow.getDate()

  const { data: birthdays } = await supabase
    .from('clients')
    .select('id, name, phone_e164, workspace_id, workspaces(name, agent_autonomy)')
    .filter('date_of_birth', 'not.is', null)
    .filter(`date_of_birth`, 'like', `%-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`)

  for (const client of birthdays || []) {
    const workspace = client.workspaces as Record<string, unknown>
    if (workspace?.agent_autonomy === 'autonomous' && client.phone_e164) {
      await supabase.functions.invoke('whatsapp-agent', {
        body: {
          phone: client.phone_e164,
          message: `🎂 Happy Birthday ${client.name}! Wishing you a wonderful day! From all of us at ${workspace?.name} 🎉`
        }
      })
      await supabase.from('agent_actions_log').insert({
        workspace_id: client.workspace_id,
        agent_id: 'client_agent',
        action_type: 'send_birthday_wish',
        entity_type: 'client',
        entity_id: client.id,
        description: `Sent birthday wish to ${client.name}`,
        status: 'completed'
      })
    } else {
      // Just notify the owner
      await supabase.from('notifications').insert({
        workspace_id: client.workspace_id,
        type: 'birthday_reminder',
        title: `🎂 ${client.name}'s birthday is tomorrow`,
        body: `Send them a warm birthday message to strengthen your relationship.`,
        action_url: `/clients/${client.id}`
      })
    }
  }
}

async function summarizeNote(
  supabase: ReturnType<typeof createClient>,
  noteId: string
) {
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const { data: note } = await supabase
    .from('notes')
    .select('*, clients(name)')
    .eq('id', noteId)
    .single()

  if (!note?.content) return

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Analyze this business note about client ${note.clients?.name}:

"${note.content}"

Return JSON only:
{
  "summary": "one sentence summary",
  "tags": ["tag1", "tag2"],
  "action_items": ["action 1", "action 2"]
}`
    }]
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
    await supabase.from('notes').update({
      ai_summary: parsed.summary,
      ai_tags: parsed.tags || [],
      ai_action_items: parsed.action_items || []
    }).eq('id', noteId)
  } catch {}
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (body.job === 'recalculate_health_scores') await recalculateHealthScores(supabase)
  if (body.job === 'check_birthdays') await checkBirthdays(supabase)
  if (body.job === 'summarize_note') await summarizeNote(supabase, body.note_id)

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 12. Agent 5 — Inventory Agent

### File: `supabase/functions/inventory-agent/index.ts`

```typescript
// supabase/functions/inventory-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function dailyCheck(supabase: ReturnType<typeof createClient>) {
  // Low stock alerts
  const { data: lowStock } = await supabase
    .from('inventory_items')
    .select('*, workspaces(name, agent_autonomy)')
    .filter('current_stock', 'lte', 'reorder_threshold')
    .eq('is_active', true)

  for (const item of lowStock || []) {
    await supabase.from('notifications').insert({
      workspace_id: item.workspace_id,
      type: 'low_stock',
      title: `Low stock: ${item.name}`,
      body: `Only ${item.current_stock} ${item.unit} remaining (threshold: ${item.reorder_threshold}).${item.supplier_name ? ` Supplier: ${item.supplier_name}` : ''}`,
      action_url: `/inventory/${item.id}`
    })
  }

  // Expiry alerts (within 5 days)
  const fiveDaysFromNow = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  const { data: expiring } = await supabase
    .from('inventory_items')
    .select('*')
    .lte('expiry_date', fiveDaysFromNow)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .eq('is_active', true)
    .gt('current_stock', 0)

  for (const item of expiring || []) {
    const daysLeft = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / 86400000
    )
    await supabase.from('notifications').insert({
      workspace_id: item.workspace_id,
      type: 'expiry_alert',
      title: `⚠️ ${item.name} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      body: `${item.current_stock} ${item.unit} of ${item.name} will expire on ${item.expiry_date}. Consider using or discounting.`,
      action_url: `/inventory/${item.id}`
    })
  }
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  if (body.job === 'daily_check') await dailyCheck(supabase)
  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 13. Agent 6 — Task Agent

### File: `supabase/functions/task-agent/index.ts`

```typescript
// supabase/functions/task-agent/index.ts
import { createClient } from '@supabase/supabase-js'

const TASK_TEMPLATES: Record<string, string[]> = {
  dog_trainer: ['Prepare training plan', 'Set up training area', 'Review session notes', 'Send progress report'],
  tailor: ['Take measurements', 'Source fabric', 'Cut fabric', 'First fitting', 'Final fitting', 'Delivery'],
  photographer: ['Confirm shoot details', 'Pack equipment', 'Backup photos', 'Edit photos', 'Deliver gallery'],
  urban_farmer: ['Check crop status', 'Harvest produce', 'Pack delivery boxes', 'Confirm delivery route'],
  yoga_studio: ['Prepare class playlist', 'Set up studio', 'Send class reminder', 'Update attendance']
}

async function generateRecurringTasks(supabase: ReturnType<typeof createClient>) {
  const { data: recurringTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_recurring', true)
    .neq('status', 'cancelled')
    .not('recurrence_rule', 'is', null)

  for (const task of recurringTasks || []) {
    const rule = task.recurrence_rule as Record<string, unknown>
    const shouldCreateToday = checkRecurrenceRule(rule)
    if (!shouldCreateToday) continue

    // Check if today's occurrence already exists
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('recurrence_parent_id', task.id)
      .gte('created_at', `${today}T00:00:00`)
      .single()

    if (existing) continue

    await supabase.from('tasks').insert({
      workspace_id: task.workspace_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee_id: task.assignee_id,
      client_id: task.client_id,
      due_date: new Date().toISOString(),
      recurrence_parent_id: task.id,
      tags: task.tags
    })
  }
}

function checkRecurrenceRule(rule: Record<string, unknown>): boolean {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const dayOfMonth = today.getDate()

  if (rule.frequency === 'daily') return true
  if (rule.frequency === 'weekly') {
    const days = (rule.days as number[]) || []
    return days.includes(dayOfWeek)
  }
  if (rule.frequency === 'monthly') {
    return dayOfMonth === (rule.day as number)
  }
  return false
}

async function createTasksFromBooking(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  businessType: string
) {
  const templates = TASK_TEMPLATES[businessType] || []
  const { data: booking } = await supabase
    .from('bookings')
    .select('workspace_id, client_id, start_time, title')
    .eq('id', bookingId)
    .single()

  if (!booking) return

  const tasks = templates.map((title, i) => ({
    workspace_id: booking.workspace_id,
    client_id: booking.client_id,
    booking_id: bookingId,
    title,
    due_date: booking.start_time,
    priority: i === 0 ? 'high' : 'normal',
    sort_order: i
  }))

  await supabase.from('tasks').insert(tasks)
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  if (body.job === 'generate_recurring') await generateRecurringTasks(supabase)
  if (body.job === 'create_from_booking') {
    await createTasksFromBooking(supabase, body.booking_id, body.business_type)
  }
  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 14. Agent 7 — WhatsApp Agent

### File: `supabase/functions/whatsapp-agent/index.ts`

```typescript
// supabase/functions/whatsapp-agent/index.ts
// Rate limit: 10 messages/minute per workspace via Upstash

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m')
})

Deno.serve(async (req) => {
  const { phone, message, workspace_id, template_name, template_params } = await req.json()

  // Rate limit per workspace
  const { success } = await ratelimit.limit(`whatsapp:${workspace_id}`)
  if (!success) {
    // Queue for later
    return new Response(JSON.stringify({ queued: true }), { status: 429 })
  }

  const TOKEN = Deno.env.get('META_WHATSAPP_TOKEN')
  const PHONE_ID = Deno.env.get('META_WHATSAPP_PHONE_ID')

  const body = template_name
    ? {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: template_name,
          language: { code: 'en_IN' },
          components: template_params || []
        }
      }
    : {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message, preview_url: false }
      }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  const result = await response.json()
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 15. Agent 8 — SEO & Public Page Agent

### File: `supabase/functions/seo-agent/index.ts`

```typescript
// supabase/functions/seo-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const { page_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const { data: page } = await supabase
    .from('public_pages')
    .select('*, workspaces(name, business_type, address)')
    .eq('id', page_id)
    .single()

  if (!page) return new Response('Not found', { status: 404 })

  const workspace = page.workspaces as Record<string, unknown>
  const city = (workspace.address as Record<string, unknown>)?.city || 'India'

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Generate SEO metadata for this business page:
Business: ${workspace.name}
Type: ${workspace.business_type}
City: ${city}
Page title: ${page.title}
Tagline: ${page.tagline || ''}

Return JSON only:
{
  "meta_title": "max 60 chars, include business name + city",
  "meta_description": "max 155 chars, include key services + location",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`
    }]
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const seo = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
    await supabase.from('public_pages').update({
      meta_title: seo.meta_title,
      meta_description: seo.meta_description
    }).eq('id', page_id)
  } catch {}

  return new Response(JSON.stringify({ ok: true }))
})
```

---

## 16. Agent 9 — AI Assistant (Floating Chat)

> The AI Assistant is the **Orchestrator** (Agent 0) exposed via a React component.
> See Agent 0 for the Edge Function. Below is the **frontend component blueprint**.

### File: `apps/web/src/components/AIAssistant/index.tsx`

```typescript
// Component interface contract — full implementation follows this spec

interface AIAssistantProps {}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// STATE
// isOpen: boolean — drawer open/closed
// messages: Message[] — conversation history
// input: string — current input text
// isLoading: boolean — waiting for AI response
// isListening: boolean — voice input active
// suggestedPrompts: string[] — contextual based on active route

// SUGGESTED PROMPTS (by route)
const SUGGESTED_PROMPTS: Record<string, string[]> = {
  '/dashboard': [
    "What's my revenue this month?",
    "Any urgent tasks I should know about?",
    "Who are my best clients?",
    "Summarize today's schedule"
  ],
  '/bookings': [
    "Book Priya for yoga tomorrow at 10am",
    "Show me this week's schedule",
    "Cancel the 3pm booking",
    "How many bookings did I get this month?"
  ],
  '/clients': [
    "Find client Rahul",
    "Who hasn't visited in 30 days?",
    "Show VIP clients",
    "Add a note for my last client"
  ],
  '/invoices': [
    "Create invoice for last session",
    "Who hasn't paid yet?",
    "Send reminder to Meera",
    "What's my outstanding amount?"
  ]
}

// ANIMATION SPEC (Framer Motion)
// Bubble (collapsed):
//   position: fixed, bottom: 24px, right: 24px
//   size: 56x56px, border-radius: 50%
//   background: linear-gradient(135deg, #7C3AED, #F97316)
//   pulse ring: scale 1→1.4, opacity 1→0, 2s loop (when agent active)
//   whileHover: scale 1.1
//   whileTap: scale 0.95

// Drawer (expanded):
//   initial: { opacity: 0, y: 20, scale: 0.95 }
//   animate: { opacity: 1, y: 0, scale: 1 }
//   exit: { opacity: 0, y: 20, scale: 0.95 }
//   spring: { stiffness: 300, damping: 28 }
//   position: fixed, bottom: 90px, right: 24px
//   size: 380x520px (desktop), 100vw 70vh (mobile)
//   border-radius: 20px

// Voice Mic Button:
//   isListening: background pulses red, scale oscillates
//   uses: window.webkitSpeechRecognition || window.SpeechRecognition
```

---

## 17. Agent 10 — Notification Agent

### File: `supabase/functions/notification-agent/index.ts`

```typescript
// Handles: in-app notification dispatch, push notifications (future), email digests
// Called by all other agents after creating notifications

Deno.serve(async (req) => {
  const { workspace_id, notification_id } = await req.json()
  // Currently: notifications stored in DB, Supabase Realtime pushes to frontend
  // Future: Web Push API via VAPID keys
  return new Response(JSON.stringify({ ok: true }))
})
```

---

# PART 4 — BACKEND API ROUTES

## 18. Edge Functions — Complete Route Map

```
FUNCTION NAME              HTTP METHOD    PATH                          AUTH REQUIRED
──────────────────────────────────────────────────────────────────────────────────────
orchestrator               POST           /functions/v1/orchestrator     YES (JWT)
digest-agent               POST           /functions/v1/digest-agent     YES (service)
booking-agent              POST           /functions/v1/booking-agent    YES (service)
invoice-agent              POST           /functions/v1/invoice-agent    YES (service)
client-agent               POST           /functions/v1/client-agent     YES (service)
inventory-agent            POST           /functions/v1/inventory-agent  YES (service)
task-agent                 POST           /functions/v1/task-agent       YES (service)
whatsapp-agent             POST           /functions/v1/whatsapp-agent   YES (service)
seo-agent                  POST           /functions/v1/seo-agent        YES (service)
pdf-generator              POST           /functions/v1/pdf-generator    YES (JWT)
public-booking             POST           /functions/v1/public-booking   NO  (public)
webhook-razorpay           POST           /functions/v1/webhook-razorpay NO  (signed)
webhook-whatsapp           GET/POST       /functions/v1/webhook-whatsapp NO  (verified)
review-submit              POST           /functions/v1/review-submit    NO  (public)
embed-client               POST           /functions/v1/embed-client     YES (service)
```

### File: `supabase/functions/pdf-generator/index.ts`

```typescript
// supabase/functions/pdf-generator/index.ts
// Uses Browserless.io API to render invoice HTML to PDF

Deno.serve(async (req) => {
  const { invoice_id, workspace_id } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*), invoice_items(*), workspaces(*)')
    .eq('id', invoice_id)
    .single()

  // Build HTML from template
  const html = renderInvoiceHTML(invoice)

  // Use Browserless to generate PDF
  const pdfResponse = await fetch('https://chrome.browserless.io/pdf', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('BROWSERLESS_TOKEN')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      html,
      options: { format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } }
    })
  })

  const pdfBuffer = await pdfResponse.arrayBuffer()

  // Upload to Supabase Storage
  const fileName = `invoices/${workspace_id}/${invoice_id}.pdf`
  const { data: uploaded } = await supabase.storage
    .from('invoice-pdfs')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  const { data: { publicUrl } } = supabase.storage
    .from('invoice-pdfs')
    .getPublicUrl(fileName)

  await supabase.from('invoices').update({ pdf_url: publicUrl }).eq('id', invoice_id)

  return new Response(JSON.stringify({ pdf_url: publicUrl }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

function renderInvoiceHTML(invoice: Record<string, unknown>): string {
  const workspace = invoice.workspaces as Record<string, unknown>
  const client = invoice.clients as Record<string, unknown>
  const items = invoice.invoice_items as Record<string, unknown>[]

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
  body { color: #1C1917; background: white; }
  .header { background: #F97316; color: white; padding: 32px; display: flex; justify-content: space-between; }
  .header h1 { font-size: 28px; font-weight: 700; }
  .invoice-meta { padding: 32px; display: flex; justify-content: space-between; }
  .table { width: 100%; border-collapse: collapse; margin: 0 32px; width: calc(100% - 64px); }
  .table th { background: #FAFAF9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #78716C; }
  .table td { padding: 12px; border-bottom: 1px solid #E7E5E4; }
  .totals { padding: 32px; display: flex; justify-content: flex-end; }
  .totals-box { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
  .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #1C1917; margin-top: 8px; padding-top: 16px; }
  .footer { padding: 32px; text-align: center; color: #78716C; font-size: 12px; border-top: 1px solid #E7E5E4; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${workspace?.name}</h1>
      <p style="opacity:0.8;margin-top:4px">${workspace?.phone || ''}</p>
    </div>
    <div style="text-align:right">
      <h2>INVOICE</h2>
      <p>#${invoice.invoice_number}</p>
      <p>Date: ${invoice.issue_date}</p>
    </div>
  </div>
  <div class="invoice-meta">
    <div>
      <p style="font-size:12px;color:#78716C;margin-bottom:4px">BILL TO</p>
      <p style="font-weight:600">${client?.name}</p>
      <p>${client?.phone || ''}</p>
      <p>${client?.email || ''}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:12px;color:#78716C">Due Date</p>
      <p style="font-weight:600">${invoice.due_date}</p>
      <p style="margin-top:8px;padding:4px 12px;background:${invoice.status === 'paid' ? '#10B981' : '#F59E0B'};color:white;border-radius:999px;font-size:12px;display:inline-block">${String(invoice.status).toUpperCase()}</p>
    </div>
  </div>
  <table class="table">
    <thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
    <tbody>
      ${items?.map(item => `<tr><td>${item.description}</td><td>${item.quantity}</td><td>₹${item.unit_price}</td><td>₹${item.amount}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span>₹${invoice.subtotal}</span></div>
      <div class="total-row"><span>GST (${invoice.tax_rate}%)</span><span>₹${invoice.tax_amount}</span></div>
      ${invoice.discount_amount ? `<div class="total-row"><span>Discount</span><span>-₹${invoice.discount_amount}</span></div>` : ''}
      <div class="total-row grand"><span>Total</span><span>₹${invoice.total}</span></div>
    </div>
  </div>
  ${invoice.notes ? `<div style="padding: 0 32px 32px"><p style="color:#78716C;font-size:12px">Notes:</p><p>${invoice.notes}</p></div>` : ''}
  <div class="footer">
    <p>Thank you for your business! 🙏</p>
    ${workspace?.gst_number ? `<p>GST: ${workspace.gst_number}</p>` : ''}
  </div>
</body>
</html>`
}
```

---

## 19. Webhook Handlers

### File: `supabase/functions/webhook-razorpay/index.ts`

```typescript
// supabase/functions/webhook-razorpay/index.ts
import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!

  const expectedSignature = createHmac('sha256', secret).update(body).digest('hex')
  if (expectedSignature !== signature) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const invoiceId = payment.notes?.invoice_id

    if (invoiceId) {
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        amount: payment.amount / 100,
        method: 'razorpay',
        reference: payment.id,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id
      })

      const { data: invoice } = await supabase
        .from('invoices')
        .select('total, amount_paid, workspace_id, clients(name, phone_e164)')
        .eq('id', invoiceId)
        .single()

      const newAmountPaid = (invoice?.amount_paid || 0) + (payment.amount / 100)
      const isPaid = newAmountPaid >= (invoice?.total || 0)

      await supabase.from('invoices').update({
        amount_paid: newAmountPaid,
        status: isPaid ? 'paid' : 'partial',
        paid_at: isPaid ? new Date().toISOString() : null
      }).eq('id', invoiceId)

      if (isPaid) {
        const client = invoice?.clients as Record<string, unknown>
        if (client?.phone_e164) {
          await supabase.functions.invoke('whatsapp-agent', {
            body: {
              phone: client.phone_e164,
              message: `✅ Payment Received! ₹${payment.amount / 100} has been received. Thank you, ${client.name}! 🙏`
            }
          })
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }))
})
```

### File: `supabase/functions/webhook-whatsapp/index.ts`

```typescript
// supabase/functions/webhook-whatsapp/index.ts
Deno.serve(async (req) => {
  // GET: webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // POST: incoming messages
  const body = await req.json()
  // Future: handle incoming WhatsApp messages (client replies)
  // For now: just acknowledge
  return new Response(JSON.stringify({ received: true }))
})
```

---

# PART 5 — FRONTEND ARCHITECTURE

## 20. File Structure — apps/web/

```
apps/web/src/
├── main.tsx                        ← Entry point
├── App.tsx                         ← Root with providers
├── router.tsx                      ← All routes
│
├── lib/
│   ├── supabase.ts                 ← Supabase client singleton
│   ├── queryClient.ts              ← TanStack Query config
│   ├── cn.ts                       ← clsx + tailwind-merge util
│   └── utils.ts                    ← formatCurrency, formatDate, etc.
│
├── store/
│   ├── authStore.ts                ← Zustand: user, session, workspace
│   ├── uiStore.ts                  ← Zustand: theme, simpleMode, sidebarOpen
│   ├── agentStore.ts               ← Zustand: agent activity feed
│   └── workspaceStore.ts           ← Zustand: current workspace config
│
├── hooks/
│   ├── useAuth.ts
│   ├── useWorkspace.ts
│   ├── useClients.ts
│   ├── useBookings.ts
│   ├── useInvoices.ts
│   ├── useTasks.ts
│   ├── useInventory.ts
│   ├── useNotifications.ts
│   ├── useRealtimeAgentFeed.ts     ← Supabase Realtime subscription
│   ├── useVoiceInput.ts            ← Web Speech API wrapper
│   └── useCommandPalette.ts
│
├── components/
│   ├── ui/                         ← shadcn/ui + custom base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── toast.tsx
│   │   └── ... (all shadcn components)
│   │
│   ├── layout/
│   │   ├── AppShell.tsx            ← Sidebar + content area
│   │   ├── Sidebar.tsx             ← Desktop navigation
│   │   ├── MobileNav.tsx           ← Bottom tab bar
│   │   ├── TopBar.tsx              ← Header with search + notifications
│   │   └── PageWrapper.tsx         ← Animation wrapper for page transitions
│   │
│   ├── AIAssistant/
│   │   ├── index.tsx               ← Floating chat bubble + drawer
│   │   ├── ChatMessage.tsx
│   │   ├── SuggestedPrompts.tsx
│   │   ├── VoiceMic.tsx
│   │   └── AgentStatusRing.tsx
│   │
│   ├── CommandPalette/
│   │   └── index.tsx
│   │
│   ├── AgentFeed/
│   │   ├── index.tsx               ← Live feed of agent actions
│   │   └── AgentActionCard.tsx
│   │
│   ├── Notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationPanel.tsx
│   │
│   └── shared/
│       ├── ClientAvatar.tsx
│       ├── StatusBadge.tsx
│       ├── LoadingSkeleton.tsx
│       ├── EmptyState.tsx
│       ├── ConfirmDialog.tsx
│       └── LanguageToggle.tsx
│
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── ForgotPassword.tsx
│   │
│   ├── onboarding/
│   │   └── Onboarding.tsx
│   │
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── KPICard.tsx
│   │   ├── RevenueChart.tsx
│   │   └── UpcomingSchedule.tsx
│   │
│   ├── bookings/
│   │   ├── Bookings.tsx
│   │   ├── BookingCalendar.tsx
│   │   ├── BookingList.tsx
│   │   ├── BookingDetail.tsx
│   │   ├── BookingForm.tsx
│   │   └── BookingWizard.tsx       ← Simple Mode
│   │
│   ├── clients/
│   │   ├── Clients.tsx
│   │   ├── ClientList.tsx
│   │   ├── ClientDetail.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientWizard.tsx        ← Simple Mode
│   │
│   ├── invoices/
│   │   ├── Invoices.tsx
│   │   ├── InvoiceList.tsx
│   │   ├── InvoiceDetail.tsx
│   │   ├── InvoiceForm.tsx
│   │   ├── InvoiceWizard.tsx       ← Simple Mode
│   │   └── InvoicePreview.tsx
│   │
│   ├── inventory/
│   │   ├── Inventory.tsx
│   │   ├── InventoryList.tsx
│   │   ├── ItemForm.tsx
│   │   └── MovementLog.tsx
│   │
│   ├── tasks/
│   │   ├── Tasks.tsx
│   │   ├── TaskKanban.tsx
│   │   ├── TaskList.tsx
│   │   └── TaskForm.tsx
│   │
│   ├── public-presence/
│   │   ├── PublicPresence.tsx
│   │   ├── PageEditor.tsx
│   │   ├── BlockPicker.tsx
│   │   └── PagePreview.tsx
│   │
│   └── settings/
│       ├── Settings.tsx
│       ├── WorkspaceSettings.tsx
│       ├── TeamSettings.tsx
│       ├── AgentSettings.tsx
│       ├── IntegrationSettings.tsx
│       └── BillingSettings.tsx
│
├── i18n/
│   ├── index.ts                    ← i18next config
│   └── locales/
│       ├── en/
│       │   ├── common.json
│       │   ├── bookings.json
│       │   ├── clients.json
│       │   ├── invoices.json
│       │   ├── tasks.json
│       │   └── settings.json
│       └── hi/
│           ├── common.json
│           └── ... (same structure)
│
└── types/
    ├── database.ts                 ← Generated Supabase types
    ├── agent.ts
    └── api.ts
```

---

## 21. Design System Implementation

### File: `apps/web/src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@400;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --nf-saffron: #F97316;
    --nf-saffron-light: #FED7AA;
    --nf-ink: #1C1917;
    --nf-clay: #44403C;
    --nf-base: #FAFAF9;
    --nf-surface: #FFFFFF;
    --nf-surface-warm: #FEF3C7;
    --nf-border: #E7E5E4;
    --nf-agent-glow: #7C3AED;
    --nf-agent-light: #EDE9FE;
    --nf-agent-success: #059669;
    --nf-agent-warn: #D97706;
    --nf-success: #10B981;
    --nf-error: #EF4444;
    --nf-warning: #F59E0B;
    --nf-info: #3B82F6;
    --nf-hindi-accent: #B45309;
    --radius-sm: 6px;
    --radius-md: 12px;
    --radius-lg: 20px;
    --radius-xl: 32px;
  }

  .dark {
    --nf-base: #0C0A09;
    --nf-surface: #1C1917;
    --nf-surface-warm: #292524;
    --nf-border: #44403C;
    --nf-ink: #FAFAF9;
    --nf-clay: #A8A29E;
  }

  body {
    background-color: var(--nf-base);
    color: var(--nf-ink);
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .font-display { font-family: 'Fraunces', serif; }
  .font-mono { font-family: 'JetBrains Mono', monospace; }
  .font-devanagari { font-family: 'Noto Sans Devanagari', sans-serif; }
}

/* Agent glow pulse animation */
@keyframes agent-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.4); }
}

.agent-pulse-ring {
  animation: agent-pulse 2s ease-in-out infinite;
}

/* Focus styles (WCAG AA) */
:focus-visible {
  outline: 2px solid var(--nf-saffron);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### File: `apps/web/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nf: {
          saffron: '#F97316',
          'saffron-light': '#FED7AA',
          ink: '#1C1917',
          clay: '#44403C',
          base: '#FAFAF9',
          surface: '#FFFFFF',
          'surface-warm': '#FEF3C7',
          border: '#E7E5E4',
          agent: {
            glow: '#7C3AED',
            light: '#EDE9FE',
            success: '#059669',
            warn: '#D97706'
          }
        }
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif']
      },
      borderRadius: {
        sm: '6px', md: '12px', lg: '20px', xl: '32px'
      },
      animation: {
        'agent-pulse': 'agent-pulse 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out'
      },
      keyframes: {
        'agent-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0', transform: 'scale(1.4)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: [animate]
}

export default config
```

---

## 22. Routing Architecture

### File: `apps/web/src/router.tsx`

```typescript
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthGuard } from './components/auth/AuthGuard'
import { WorkspaceGuard } from './components/auth/WorkspaceGuard'

export const router = createBrowserRouter([
  // Public auth routes
  { path: '/login', lazy: () => import('./pages/auth/Login') },
  { path: '/signup', lazy: () => import('./pages/auth/Signup') },
  { path: '/forgot-password', lazy: () => import('./pages/auth/ForgotPassword') },
  { path: '/auth/callback', lazy: () => import('./pages/auth/Callback') },

  // Onboarding (auth required, no workspace yet)
  {
    path: '/onboarding',
    element: <AuthGuard><Onboarding /></AuthGuard>
  },

  // App routes (auth + workspace required)
  {
    path: '/',
    element: <AuthGuard><WorkspaceGuard><AppShell /></WorkspaceGuard></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', lazy: () => import('./pages/dashboard/Dashboard') },
      { path: 'bookings', lazy: () => import('./pages/bookings/Bookings') },
      { path: 'bookings/:id', lazy: () => import('./pages/bookings/BookingDetail') },
      { path: 'clients', lazy: () => import('./pages/clients/Clients') },
      { path: 'clients/:id', lazy: () => import('./pages/clients/ClientDetail') },
      { path: 'invoices', lazy: () => import('./pages/invoices/Invoices') },
      { path: 'invoices/:id', lazy: () => import('./pages/invoices/InvoiceDetail') },
      { path: 'inventory', lazy: () => import('./pages/inventory/Inventory') },
      { path: 'tasks', lazy: () => import('./pages/tasks/Tasks') },
      { path: 'presence', lazy: () => import('./pages/public-presence/PublicPresence') },
      { path: 'settings', lazy: () => import('./pages/settings/Settings') },
      { path: 'settings/:tab', lazy: () => import('./pages/settings/Settings') }
    ]
  },

  { path: '*', element: <Navigate to="/dashboard" replace /> }
])
```

---

## 23. Global State & Data Fetching

### File: `apps/web/src/store/authStore.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  workspaceId: string | null
  workspaceRole: 'owner' | 'admin' | 'staff' | 'viewer' | null
  setAuth: (user: User | null, session: Session | null) => void
  setWorkspace: (id: string, role: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      workspaceId: null,
      workspaceRole: null,
      setAuth: (user, session) => set({ user, session }),
      setWorkspace: (id, role) => set({ workspaceId: id, workspaceRole: role as never }),
      logout: () => set({ user: null, session: null, workspaceId: null, workspaceRole: null })
    }),
    { name: 'nf-auth', partialize: (s) => ({ workspaceId: s.workspaceId }) }
  )
)
```

### File: `apps/web/src/lib/queryClient.ts`

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes default
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
})

// Query key factory
export const QK = {
  dashboard: (wid: string) => ['dashboard', wid],
  clients: (wid: string, filters?: object) => ['clients', wid, filters],
  client: (id: string) => ['client', id],
  bookings: (wid: string, filters?: object) => ['bookings', wid, filters],
  booking: (id: string) => ['booking', id],
  invoices: (wid: string, filters?: object) => ['invoices', wid, filters],
  invoice: (id: string) => ['invoice', id],
  tasks: (wid: string, filters?: object) => ['tasks', wid, filters],
  inventory: (wid: string) => ['inventory', wid],
  notifications: (wid: string) => ['notifications', wid],
  agentLog: (wid: string) => ['agentLog', wid],
  services: (wid: string) => ['services', wid],
  workspace: (id: string) => ['workspace', id]
}
```

---

# PART 6 — FEATURE UI BLUEPRINTS

## 24. Onboarding Wizard

### File: `apps/web/src/pages/onboarding/Onboarding.tsx`

```typescript
// COMPONENT SPEC — implement this interface

// STEPS (5 total, animated slide transitions)
const STEPS = [
  {
    id: 'business_type',
    title: "What kind of business do you run?",
    titleHi: "आप किस तरह का व्यवसाय चलाते हैं?",
    component: 'BusinessTypeSelector',
    // Visual: 3x3 grid of large illustrated cards
    // Each card: emoji icon (large), business type name, brief description
    // Selection: card scales up 1.05, border becomes saffron, check mark appears
    options: [
      { value: 'dog_trainer', emoji: '🐕', label: 'Dog Trainer', labelHi: 'डॉग ट्रेनर' },
      { value: 'tailor', emoji: '🧵', label: 'Tailor', labelHi: 'दर्जी' },
      { value: 'photographer', emoji: '📸', label: 'Photographer', labelHi: 'फ़ोटोग्राफ़र' },
      { value: 'urban_farmer', emoji: '🌱', label: 'Urban Farmer', labelHi: 'शहरी किसान' },
      { value: 'yoga_studio', emoji: '🧘', label: 'Yoga Studio', labelHi: 'योगा स्टूडियो' },
      { value: 'salon', emoji: '💇', label: 'Salon', labelHi: 'सैलून' },
      { value: 'tutor', emoji: '📚', label: 'Tutor', labelHi: 'ट्यूटर' },
      { value: 'caterer', emoji: '🍱', label: 'Caterer', labelHi: 'खानपान' },
      { value: 'other', emoji: '✨', label: 'Other', labelHi: 'अन्य' }
    ]
  },
  {
    id: 'basic_info',
    title: "Tell us about your business",
    component: 'BasicInfoForm',
    fields: ['name', 'phone', 'city', 'gst_number (optional)']
  },
  {
    id: 'language',
    title: "Choose your preferred language",
    component: 'LanguageSelector',
    options: [
      { value: 'en', label: 'English', native: 'English' },
      { value: 'hi', label: 'Hindi', native: 'हिंदी' },
      { value: 'mr', label: 'Marathi', native: 'मराठी' },
      { value: 'ta', label: 'Tamil', native: 'தமிழ்' }
    ]
  },
  {
    id: 'first_service',
    title: "Add your first service",
    component: 'ServiceForm',
    fields: ['name', 'duration', 'price'],
    subtitle: "You can add more later"
  },
  {
    id: 'complete',
    title: "You're all set! 🎉",
    component: 'CompletionScreen',
    // Confetti animation via canvas-confetti
    // 3 quick-start action buttons: Add first client, Create booking, View dashboard
  }
]

// ANIMATION SPEC
// Step transition: AnimatePresence mode="wait"
// Enter: { x: 40, opacity: 0 } → { x: 0, opacity: 1 }, spring stiffness:300
// Exit: { x: -40, opacity: 0 }, duration: 0.15
// Progress bar: motion.div with width animated as percentage
// Step circles: layoutId for active indicator to slide between steps
```

---

## 25. Dashboard Module

### File: `apps/web/src/pages/dashboard/Dashboard.tsx`

```typescript
// LAYOUT SPEC

// Desktop (≥1024px):
//   Row 1: 4 KPI Cards (Revenue MTD, Bookings Today, Active Clients, Tasks Overdue)
//   Row 2: Revenue Chart (60%) | Agent Activity Feed (40%)
//   Row 3: Upcoming Schedule (50%) | Quick Actions (50%)

// Mobile (<768px):
//   Horizontal scroll: 4 KPI cards in a row (no wrap, scrollable)
//   Stacked: Agent Feed, Upcoming Schedule, Quick Actions

// KPI CARD SPEC
interface KPICardProps {
  title: string
  value: string | number
  prefix?: string  // e.g. "₹"
  change?: number  // percentage change vs last period
  changeLabel?: string
  icon: LucideIcon
  iconBg: string   // e.g. "#FED7AA"
  iconColor: string
  onClick?: () => void
  isLoading?: boolean
}
// Animation: staggerChildren 0.1s, each card y:20→0, opacity:0→1
// Hover: translateY(-2px), boxShadow increase
// Value: animated counter on mount (react-countup or manual requestAnimationFrame)
// "Explain this" icon: hover reveals info button → click opens AI explanation

// REVENUE CHART SPEC
// Type: Area chart (Recharts AreaChart)
// X-axis: last 30 days (DD/MM)
// Y-axis: ₹ amounts
// Gradient fill: saffron (#F97316) at top → transparent at bottom
// Stroke: #F97316, strokeWidth: 2
// Tooltip: custom styled card with date + ₹amount
// Period selector: Today | Week | Month | Year (tab switcher)

// AGENT ACTIVITY FEED SPEC
// Real-time via Supabase Realtime (agent_actions_log)
// Each item:
//   - Agent icon (colored per agent type)
//   - Description text (plain language)
//   - Timestamp (relative: "2 minutes ago")
//   - Entity link (click to navigate to entity)
//   - Undo button (within 5 minutes of action)
// Animation: new items slide in from top (y:-20→0, opacity:0→1)
// Max visible: 8 items, "View all" link

// UPCOMING SCHEDULE STRIP
// Next 3-5 bookings
// Each: avatar + client name + service + time
// "Today" label + date
// Click → navigate to booking detail
```

---

## 26. Bookings Module

```typescript
// VIEWS: Calendar | List (tab switcher at top)

// CALENDAR VIEW SPEC
// Library: FullCalendar with React wrapper
// Views: dayGridMonth, timeGridWeek, timeGridDay
// Mobile: timeGridDay only (week = overwhelming on small screen)
// Event color: service.color (defaults to #F97316)
// Event click → booking detail slide-over
// Date click → new booking pre-filled with date

// Booking Detail Slide-over:
//   Slides in from right (Framer Motion x: 400→0)
//   Shows: client info, service, time, status badge, notes
//   Actions: Edit, Complete, Cancel, No-show, Create Invoice
//   On Complete: trigger invoice-agent (if autonomy allows)

// LIST VIEW SPEC
// Grouped by: Today | Tomorrow | This Week | Later
// Each row: status dot, client avatar+name, service, time, price, actions
// Status badge colors:
//   confirmed: #3B82F6 (blue)
//   completed: #10B981 (green)
//   cancelled: #EF4444 (red)
//   no_show:   #F59E0B (amber)
//   pending:   #8B5CF6 (purple)

// BOOKING FORM SPEC
// Full form fields:
//   Client: SearchableSelect (creates new client inline)
//   Service: ServicePicker (visual cards)
//   Date: DatePicker (month view, highlights available days)
//   Time: TimePicker (grid of 30min slots, grays out conflicts)
//   Duration: auto-filled from service, editable
//   Price: auto-filled from service, editable
//   Location: text input with autocomplete
//   Notes: textarea
//   Recurrence: toggle → RecurrenceBuilder (daily/weekly/monthly)
// On Submit:
//   1. Create booking in DB
//   2. Invoke booking-agent for confirmation
//   3. Show success toast with "Confirmation sent to [client]" if WA configured
```

---

## 27. Clients & Notes Module

```typescript
// CLIENT LIST VIEW
// Left panel: list (searchable, filterable by tags, health score, last seen)
// Right panel: client detail (desktop split view)
// Mobile: full screen list → tap to detail
//
// Client card in list:
//   Avatar (initials if no photo), name, phone, health score ring, last seen
//   Health score ring: SVG circle, color:
//     80-100: #10B981 (green)
//     50-79:  #F59E0B (amber)
//     0-49:   #EF4444 (red)
//   Tags: small colored chips

// CLIENT DETAIL PAGE SPEC
// Layout: 2 columns (desktop), stacked (mobile)
//
// Left column (sticky):
//   Avatar (large, editable)
//   Name + phone + email
//   Custom fields (business-type specific)
//   Tags (editable inline)
//   Health score + breakdown
//   Action buttons: Book, Invoice, Message, Call
//
// Right column (scrollable):
//   Tab bar: Overview | Notes | Interactions | Bookings | Invoices
//
//   Overview tab:
//     Stats: Total bookings, Revenue paid, First visit, Last visit
//     Next appointment card
//     Outstanding invoice card (if any)
//
//   Notes tab:
//     New note input (Tiptap rich editor + VoiceMic button)
//     Note list (newest first)
//     Each note: content + AI summary chip + action items + timestamp
//     Voice input: VoiceMic button → recording → transcript → save
//
//   Interactions tab:
//     Chronological timeline of all touchpoints
//     Each: type icon + description + timestamp + link

// CUSTOM FIELDS BY BUSINESS TYPE
// Rendered dynamically from workspace.business_type
// dog_trainer: breed, weight_kg, age, vaccination_expiry, behavioral_notes
// tailor: measurements JSON (chest, waist, hips, inseam, shoulder, sleeve, neck)
// photographer: shoot_preferences, delivery_email, usage_rights_agreed
// Measurements UI: Framer Motion animated body silhouette with labels
```

---

## 28. Invoices Module

```typescript
// INVOICE LIST
// Tabs: All | Draft | Sent | Paid | Overdue
// Each row: invoice #, client name, amount, due date, status badge, % paid (progress bar), actions
// Bulk actions: Select multiple → Send, Delete, Export

// INVOICE FORM
// Fields:
//   Client: SearchableSelect
//   Booking link: optional
//   Issue date: DatePicker (default today)
//   Due date: DatePicker (default +7 days)
//   Line items: dynamic list
//     - Each: description, qty, unit price, amount (calculated)
//     - Add item button
//     - Drag to reorder
//   Tax rate: % input (default 18 for GST)
//   Discount: toggle → fixed/percent input
//   Notes: textarea
//   Terms: textarea
// Calculated totals shown live at bottom

// INVOICE DETAIL PAGE
// Split: form (left) | live preview (right, desktop)
// Actions bar:
//   Send → opens WhatsApp + Email send dialog
//   Download PDF → triggers pdf-generator
//   Record Payment → opens payment recording dialog
//   Share Link → copies public_token URL

// PUBLIC INVOICE VIEW (/invoice/:token)
// In apps/public/ (Next.js)
// No login required
// Shows: branded invoice with workspace logo
// Payment button: Razorpay payment link
// "Pay with UPI" button: renders UPI QR code
// On payment: updates invoice status via Razorpay webhook

// INVOICE PREVIEW COMPONENT
// Uses iFrame or same HTML as PDF generator
// Responsive: looks good on all screen sizes
// Print-friendly CSS
```

---

## 29. Inventory Module

```typescript
// INVENTORY LIST
// Grid view (default): item cards with photo, name, stock level, status badge
// Table view: all fields, sortable
// Stock level indicator:
//   Full bar = full stock, color shifts:
//   > 50% stock: green | 20-50%: amber | < 20%: red
//
// Quick stock adjustment: +/- buttons on card (inline without modal for fast updates)

// ITEM FORM
// Fields: name, SKU, category, unit, reorder_threshold, cost_price, selling_price
//   supplier_name, supplier_phone, expiry_date (for perishables)
//   is_perishable toggle, barcode (scan via camera)
//
// BARCODE SCANNER (camera)
// Uses ZXing (@zxing/browser)
// Opens camera modal, scans → fills barcode field
// Also works for QR codes

// STOCK MOVEMENT LOG
// For each item: timeline of in/out/adjustment/waste movements
// Each row: type icon (↑↓⚙️🗑️), quantity, balance after, note, timestamp
// Quick add movement: bottom sheet on mobile, modal on desktop
```

---

## 30. Tasks Module

```typescript
// THREE VIEWS: Kanban | List | Calendar
// View switcher: segmented control at top

// KANBAN VIEW
// 4 columns: Todo | In Progress | Done | Cancelled
// Column header: count badge + "Add" button
// Task card:
//   Priority dot (urgent=red, high=amber, normal=blue, low=gray)
//   Title (line-clamp-2)
//   Client chip (if linked)
//   Due date chip (red if overdue)
//   Subtask progress: "2/5 subtasks"
//   Assignee avatar
// Drag: dnd-kit, smooth transition with layoutId
// Drop zone: column highlights with saffron border
//
// LIST VIEW
// Grouped by: Priority | Due Date | Assignee | Status (user-selectable)
// Each task row: priority dot, title, subtask count, due date, assignee, status toggle
// Click to expand: shows subtasks + notes inline
// Bulk select: checkboxes → bulk status change, assign, delete
//
// TASK FORM (slide-over panel)
// Fields: title, description (Tiptap), priority, due date, estimated time
//   assignee (workspace member select), client link, booking link, invoice link
//   tags, recurrence toggle + builder
// Subtasks: checklist below (add inline)

// QUICK ADD
// Press 'T' anywhere → QuickAddTask dialog with just title + due date
// Enter submits, Esc closes
```

---

## 31. Public Presence Module

```typescript
// PAGE EDITOR SPEC
// Block-based editor (inspired by Notion)
// Left panel: page settings (title, slug, theme)
// Center: live block editor
// Right: device preview (Desktop | Mobile toggle)

// AVAILABLE BLOCKS
const PAGE_BLOCKS = [
  { type: 'hero', label: 'Hero Section', icon: '🏠', 
    fields: ['heading', 'subheading', 'background_image', 'cta_text', 'cta_link'] },
  { type: 'services', label: 'Services Grid', icon: '💼',
    description: 'Auto-fetches from services catalog' },
  { type: 'about', label: 'About Section', icon: '👤',
    fields: ['text', 'photo', 'highlight_stats'] },
  { type: 'gallery', label: 'Photo Gallery', icon: '🖼️',
    fields: ['images[]', 'columns', 'caption_enabled'] },
  { type: 'reviews', label: 'Reviews', icon: '⭐',
    description: 'Auto-fetches published reviews' },
  { type: 'booking_widget', label: 'Book Now Widget', icon: '📅',
    fields: ['heading', 'show_services', 'show_calendar'] },
  { type: 'contact', label: 'Contact Info', icon: '📞',
    fields: ['phone', 'email', 'address', 'map_embed', 'whatsapp_button'] },
  { type: 'faq', label: 'FAQ', icon: '❓',
    fields: ['items[]'] },
  { type: 'divider', label: 'Divider', icon: '—', fields: [] }
]

// BLOCK INTERACTION
// Click block: shows inline edit toolbar (Framer Motion slide up)
// Drag handle: vertical reorder with dnd-kit
// Delete: hover → trash icon appears → click → confirm
// Add block: "+" button between blocks → block picker panel slides in

// SLUG VALIDATION
// Must be URL-safe: lowercase, hyphens only
// Check uniqueness against public_pages table
// Preview URL shown below input: p.nicheflow.in/[slug]
```

---

## 32. Settings Module

```typescript
// SETTINGS LAYOUT
// Left: settings sidebar (categories)
// Right: settings panel
//
// CATEGORIES
// [1] Workspace — name, logo, phone, email, GST, address
// [2] Business — business type, services, working hours, holidays
// [3] Team — invite member, manage roles, remove member
// [4] AI & Agents — autonomy level, agent-specific toggles, audit log
// [5] Notifications — WhatsApp alerts, email, push, digest time
// [6] Integrations — WhatsApp setup, Razorpay, Google Calendar, Tally
// [7] Language — language selection, date/currency format
// [8] Billing — current plan, usage, upgrade/downgrade
// [9] Danger Zone — export data, delete workspace

// AI & AGENTS TAB SPEC
// Autonomy slider:
//   Conservative: "Agent only suggests, you approve every action"
//   Balanced: "Agent auto-sends reminders, drafts other actions for approval"
//   Autonomous: "Agent acts fully, logs everything for you to review"
//
// Per-agent toggles:
//   Booking Confirmation Agent: ON/OFF
//   24h & 2h Reminders: ON/OFF
//   No-show Auto-mark: ON/OFF
//   Invoice Auto-generation: ON/OFF
//   Overdue Reminders: ON/OFF (3d/7d/14d)
//   Birthday Greetings: ON/OFF
//   Morning Digest: ON/OFF + time picker
//   Inventory Alerts: ON/OFF
//
// Agent Audit Log: table of all agent_actions_log entries
//   Filterable by agent, date, action type
//   "Undo" button on recent actions (within 5 min)

// INTEGRATIONS TAB SPEC
// WhatsApp:
//   Status card: Connected/Not Connected
//   If not connected: step-by-step guide to get Meta token
//   Phone number display, test message button
//
// Razorpay:
//   API key input (masked), test mode toggle
//   Test connection button
//
// Google Calendar:
//   OAuth flow (opens Google consent)
//   Calendar selector (which calendar to sync to)
```

---

## 33. Command Palette

### File: `apps/web/src/components/CommandPalette/index.tsx`

```typescript
// ACTIVATION: ⌘K (mac) / Ctrl+K (windows) / "/" when no input focused
//
// LAYOUT
// Centered modal, max-w-lg
// Input at top with search icon
// Results list below (max 8 items visible, scroll)
// Footer: keyboard hints (↑↓ navigate, Enter select, Esc close)
//
// RESULT SECTIONS (in order)
// 1. Recent pages (from localStorage)
// 2. Navigation ("Go to Bookings", "Go to Clients", etc.)
// 3. Clients (fuzzy search via Fuse.js on cached client list)
// 4. Quick actions ("New Booking", "New Client", "New Invoice", "New Task")
// 5. AI route: if input starts with "?" → "Ask AI: [query]" item at top
//
// IMPLEMENTATION
// Library: cmdk (headless command palette)
// Search: Fuse.js for client fuzzy search (pre-loaded in memory)
// Keyboard: cmdk handles ↑↓Enter natively
//
// CODE SKETCH
// <CommandDialog open={open} onOpenChange={setOpen}>
//   <CommandInput placeholder="Search or type a command..." />
//   <CommandList>
//     <CommandGroup heading="Navigation">
//       {NAV_ITEMS.map(item => <CommandItem onSelect={() => navigate(item.path)}>)}
//     </CommandGroup>
//     <CommandGroup heading="Clients">
//       {clientResults.map(c => <CommandItem onSelect={() => navigate(`/clients/${c.id}`)}>)}
//     </CommandGroup>
//     {input.startsWith('?') && (
//       <CommandItem onSelect={() => openAIWith(input.slice(1))}>
//         Ask AI: {input.slice(1)}
//       </CommandItem>
//     )}
//   </CommandList>
// </CommandDialog>
```

---

## 34. AI Assistant (Floating)

### File: `apps/web/src/components/AIAssistant/index.tsx`

```typescript
// FULL IMPLEMENTATION SPEC

// STATE MACHINE
// idle → open (click bubble) → listening (click mic) → loading (send) → response → idle

// BUBBLE (collapsed state)
// Fixed: bottom-6 right-6 (mobile: bottom-20 to clear bottom nav)
// Size: 56x56px, rounded-full
// Background: linear-gradient(135deg, var(--nf-agent-glow), var(--nf-saffron))
// Shadow: 0 8px 32px rgba(124, 58, 237, 0.3)
// Icon: Sparkles (Lucide) when idle, X when open
// Framer: whileHover scale 1.1, whileTap scale 0.95
// Pulse ring: absolute inset-0, rounded-full, bg-purple-400, animation: agent-pulse
//   Visible only when agent is running (agentStore.isRunning)

// DRAWER (expanded state)
// AnimatePresence: initial {opacity:0, y:20, scale:0.95} → animate {opacity:1, y:0, scale:1}
// Spring: stiffness:300, damping:28
// Size desktop: 380x520px, positioned bottom-20 right-6
// Size mobile: fixed bottom-0 right-0 left-0, height:70vh, rounded-t-2xl
// Backdrop: none (agent is ambient, not blocking)

// HEADER
// "NicheFlow Brain" + small purple dot (status indicator)
// Status: "Ready" | "Thinking..." | "Listening..."
// Close button (X) top right

// SUGGESTED PROMPTS
// Rendered when no conversation yet
// 4 chips, wrapping flex
// Route-aware (see SUGGESTED_PROMPTS const above)
// Click: sets input + immediately sends

// MESSAGES
// User messages: right-aligned, saffron background
// AI messages: left-aligned, white card with subtle purple border
// Typing indicator: 3 animated dots (stagger 0.15s, y:0→-4→0, loop)
// Auto-scroll to bottom on new message (useEffect → ref.scrollIntoView)

// INPUT ROW
// Text input (auto-resize, max 4 lines)
// VoiceMic button (left of input)
// Send button (right, disabled when empty or loading)

// VOICE INPUT SPEC
// Uses: window.SpeechRecognition || window.webkitSpeechRecognition
// Language: set to workspace.language ('hi-IN' for Hindi, 'en-IN' for English)
// Interim results: shown in input as gray text
// Final result: replaces input text, auto-sends after 1s silence
// Visual: mic button pulses red when active, shows live amplitude bar

// API CALL
// POST to /functions/v1/orchestrator
// Body: { message, workspaceId, conversationHistory, language }
// Response: { reply, updatedHistory }
// Store updatedHistory in component state for multi-turn
```

---

## 35. Simple Mode Wizards

```typescript
// SHARED WIZARD SHELL
// Applies to: BookingWizard, ClientWizard, InvoiceWizard
// Toggle: floating button in top-right of each module ("✨ Simple Mode")
// Persists in localStorage per user

// WIZARD ARCHITECTURE
// AnimatePresence + spring transitions between steps
// Step progress: dots indicator at top (filled = completed, active = pulsing)
// Each step: full-screen on mobile, centered modal on desktop
// Back button: always visible (except step 1)
// Skip button: for optional steps
// Next button: disabled until required fields filled

// BOOKING WIZARD (5 steps)
// Step 1: "Who is this booking for?"
//   SearchableClientSelect with "Add new client" inline
//   Large touch targets (min 48px height)
//
// Step 2: "What service?"
//   Visual service cards (large, with price + duration)
//   Single select
//
// Step 3: "Which day?"
//   Scrollable week strip (S M T W T F S)
//   Next 14 days shown
//   Unavailable days grayed out
//
// Step 4: "What time?"
//   Grid of available 30min slots
//   Grouped: Morning | Afternoon | Evening
//
// Step 5: "Confirm"
//   Summary card (client, service, date, time, price)
//   Confirm button → creates booking → confetti → success screen

// ANIMATION: each step slides in from right (x:40→0), previous slides left (x:0→-40)
```

---

## 36. Mobile Navigation

```typescript
// BOTTOM NAV SPEC
// Fixed: bottom-0 left-0 right-0
// Height: 64px + safe-area-inset-bottom (for iPhone X notch)
// Background: white/dark with subtle border-top
// 5 tabs: Dashboard | Bookings | Clients | Tasks | More (Settings+)
//
// Active tab:
//   Animated indicator pill (layoutId="active-tab-indicator")
//   Slides smoothly between tabs (Framer layoutId)
//   Icon: scale 1→1.15 spring
//
// FAB (Quick Add):
//   Absolute: bottom-16 right-4 (floats above bottom nav)
//   Saffron circle, size 48x48
//   Tap: expands to 4 action buttons (fan out with stagger)
//     New Booking | New Client | New Invoice | New Task
//   Animation: scale+rotate(45deg) on open, reverse on close
//
// Mobile-specific adjustments:
//   Content area: padding-bottom: 80px (clear bottom nav)
//   AI Assistant bubble: bottom-20 right-4 (above bottom nav)
```

---

# PART 7 — PUBLIC APPS (Next.js)

## 37. Public Business Page /p/:slug

### File: `apps/public/app/p/[slug]/page.tsx`

```typescript
// SERVER COMPONENT with ISR
// Revalidation: on-demand (triggered by seo-agent on page save)

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = 3600 // fallback: 1 hour

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: page } = await supabase.from('public_pages').select('meta_title, meta_description, og_image_url, title').eq('slug', params.slug).eq('published', true).single()
  if (!page) return { title: 'Not Found' }
  return {
    title: page.meta_title || page.title,
    description: page.meta_description,
    openGraph: { images: [page.og_image_url || ''] }
  }
}

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: page } = await supabase.from('public_pages')
    .select('*, workspaces(name, phone, address, business_type)')
    .eq('slug', params.slug)
    .eq('published', true)
    .single()

  if (!page) notFound()

  // Track view (non-blocking)
  supabase.from('public_pages').update({ views_count: page.views_count + 1 }).eq('id', page.id)

  const blocks = page.blocks as Array<{ type: string; data: Record<string, unknown> }>

  return (
    <main>
      {blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} page={page} />
      ))}
      {/* Floating WhatsApp button */}
      <a href={`https://wa.me/${page.workspaces?.phone}`}
         className="fixed bottom-6 right-6 bg-green-500 text-white rounded-full p-4 shadow-lg">
        {/* WhatsApp SVG icon */}
      </a>
    </main>
  )
}
```

---

## 38. Public Invoice /invoice/:token

### File: `apps/public/app/invoice/[token]/page.tsx`

```typescript
// No auth required
// Fetches invoice by public_token
// Shows: full branded invoice
// Payment button: opens Razorpay checkout OR shows UPI QR
// On successful payment: webhook updates status, page shows "PAID" stamp

export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const supabase = createClient(...)
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name, email), invoice_items(*), workspaces(name, phone, logo_url, address, gst_number)')
    .eq('public_token', params.token)
    .single()

  if (!invoice) notFound()

  // Mark as viewed
  if (!invoice.viewed_at) {
    await supabase.from('invoices').update({ viewed_at: new Date().toISOString(), status: invoice.status === 'sent' ? 'viewed' : invoice.status }).eq('public_token', params.token)
  }

  return <InvoicePublicView invoice={invoice} />
}
```

---

## 39. Public Booking Widget

### File: `apps/public/app/book/[slug]/page.tsx`

```typescript
// Embeddable booking widget
// Multi-step: Service → Date → Time → Client Details → Confirm

// Can be embedded in public page (as block) or standalone URL
// Client details: name, phone, email (no login required)
// Submit: creates booking with status='pending', sends confirmation to business owner
// Rate limited: 30 submissions/hour per IP (Cloudflare rule)
```

---

# PART 8 — INFRASTRUCTURE CODE

## 40. Supabase Client Setup

### File: `apps/web/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  },
  global: {
    headers: { 'x-app-version': '1.0.0' }
  }
})

// Set workspace context for RLS on every authenticated request
supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    // Workspace context is set server-side in Edge Functions
    // For direct DB calls, we rely on JWT claims + RLS policies
  }
})
```

---

## 41. Auth Implementation

### File: `apps/web/src/components/auth/AuthGuard.tsx`

```typescript
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, setAuth } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user || null, session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuth(session?.user || null, session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

### File: `apps/web/src/pages/auth/Login.tsx`

```typescript
// LOGIN PAGE SPEC
// Layout: centered card (400px wide, white, shadow-lg, rounded-lg)
// Above card: NicheFlow logo + tagline
//
// FIELDS
// Email input (auto-focus)
// Password input (show/hide toggle)
// "Forgot password?" link (right-aligned below password)
//
// BUTTONS
// "Sign in" primary CTA (full width, saffron)
// OR divider
// "Continue with Google" (optional, outline button)
// "Send magic link" link below (passwordless option)
//
// BELOW CARD
// "Don't have an account? Sign up" link
//
// ON SUCCESS
// Check if workspace exists for user
//   Yes → redirect to /dashboard
//   No → redirect to /onboarding
//
// ERROR HANDLING
// Inline error below form (not alert, just red text)
// Common errors: "Invalid email or password", "Email not confirmed"
//
// ANIMATION
// Card: fade-in + y:10→0 on mount
// Error message: shake animation (keyframes: x -5→5→-5→0)
```

---

## 42. Rate Limiting Middleware

### File: `supabase/functions/_shared/ratelimit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!
})

export const rateLimiters = {
  // AI assistant: 500 req/day per workspace (pro), 20/day (free)
  aiAssistant: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(500, '24 h'),
    prefix: 'rl:ai'
  }),

  // WhatsApp: 10/min per workspace
  whatsapp: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:wa'
  }),

  // Public booking: 30/hour per IP
  publicBooking: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    prefix: 'rl:pub_book'
  }),

  // General API: 100/min per user
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:api'
  })
}

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ allowed: boolean; resetIn?: number }> {
  const { success, reset } = await limiter.limit(identifier)
  return {
    allowed: success,
    resetIn: success ? undefined : Math.ceil((reset - Date.now()) / 1000)
  }
}
```

---

## 43. PDF Generation Service

> See Edge Function `pdf-generator` in Section 18 above.
> The `renderInvoiceHTML` function is already specified.

---

## 44. i18n Configuration

### File: `apps/web/src/i18n/index.ts`

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import enCommon from './locales/en/common.json'
import enBookings from './locales/en/bookings.json'
import enClients from './locales/en/clients.json'
import enInvoices from './locales/en/invoices.json'
import hiCommon from './locales/hi/common.json'
import hiBookings from './locales/hi/bookings.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    ns: ['common', 'bookings', 'clients', 'invoices', 'tasks', 'settings'],
    defaultNS: 'common',
    resources: {
      en: { common: enCommon, bookings: enBookings, clients: enClients, invoices: enInvoices },
      hi: { common: hiCommon, bookings: hiBookings }
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
```

### File: `apps/web/src/i18n/locales/en/common.json`

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "bookings": "Bookings",
    "clients": "Clients",
    "invoices": "Invoices",
    "inventory": "Inventory",
    "tasks": "Tasks",
    "presence": "Public Page",
    "settings": "Settings"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "send": "Send",
    "confirm": "Confirm"
  },
  "status": {
    "confirmed": "Confirmed",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "pending": "Pending",
    "draft": "Draft",
    "sent": "Sent",
    "paid": "Paid",
    "overdue": "Overdue"
  },
  "currency": "₹",
  "ai": {
    "thinking": "Thinking...",
    "ready": "Ready",
    "placeholder": "Ask me anything...",
    "suggested": "Suggested"
  }
}
```

### File: `apps/web/src/i18n/locales/hi/common.json`

```json
{
  "nav": {
    "dashboard": "डैशबोर्ड",
    "bookings": "बुकिंग",
    "clients": "ग्राहक",
    "invoices": "चालान",
    "inventory": "इन्वेंटरी",
    "tasks": "कार्य",
    "presence": "सार्वजनिक पेज",
    "settings": "सेटिंग्स"
  },
  "actions": {
    "save": "सहेजें",
    "cancel": "रद्द करें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "add": "जोड़ें",
    "search": "खोजें",
    "confirm": "पुष्टि करें",
    "send": "भेजें"
  },
  "ai": {
    "thinking": "सोच रहा हूँ...",
    "ready": "तैयार",
    "placeholder": "कुछ भी पूछें..."
  }
}
```

---

# PART 9 — TESTING & DEPLOYMENT

## 45. Test Strategy & Files

### File: `apps/web/src/__tests__/agents.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'

// Unit tests for agent logic
describe('Booking Agent', () => {
  it('sends 24h reminder for bookings 23-25h away', async () => {
    // Mock supabase, check correct bookings selected
  })
  it('marks no-show for completed bookings without check-in', async () => {})
  it('does not double-send reminders', async () => {})
})

describe('Invoice Agent', () => {
  it('marks invoice as overdue after due_date + 3 days', async () => {})
  it('sends correct escalating message on day 3, 7, 14', async () => {})
})

describe('Client Health Score', () => {
  it('gives 100 for active client with multiple bookings', async () => {})
  it('gives <30 for client inactive 60+ days', async () => {})
})
```

### File: `e2e/critical-flows.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  test('Onboarding: complete 5-step wizard', async ({ page }) => {
    await page.goto('/onboarding')
    // Select business type
    await page.click('[data-testid="business-type-tailor"]')
    await page.click('[data-testid="wizard-next"]')
    // Fill business info
    await page.fill('[name="name"]', 'Test Tailor Shop')
    await page.fill('[name="phone"]', '9876543210')
    await page.click('[data-testid="wizard-next"]')
    // Select language
    await page.click('[data-testid="lang-en"]')
    await page.click('[data-testid="wizard-next"]')
    // Add service
    await page.fill('[name="service-name"]', 'Shirt Stitching')
    await page.fill('[name="service-price"]', '500')
    await page.click('[data-testid="wizard-next"]')
    // Complete
    await expect(page.locator('[data-testid="completion-screen"]')).toBeVisible()
    await page.click('[data-testid="go-to-dashboard"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('Create booking end-to-end', async ({ page }) => {
    // Login, navigate to bookings, create booking, verify in calendar
  })

  test('Create and send invoice', async ({ page }) => {
    // Create invoice, add line items, click Send, verify WhatsApp confirm
  })

  test('AI Assistant: create booking via chat', async ({ page }) => {
    // Open AI bubble, type "Book Priya for yoga tomorrow at 10am"
    // Verify booking appears in calendar
  })
})
```

---

## 46. CI/CD Pipeline Files

### File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [staging, main]
  pull_request:
    branches: [staging, main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web lint
      - run: pnpm --filter web typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web test --run

  e2e:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm exec playwright test
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      - run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    runs-on: ubuntu-latest
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }
      # Backup before migration
      - run: supabase db dump --linked -f backup-$(date +%Y%m%d).sql
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - run: supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      - name: Create Sentry release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: nicheflow-web
```

---

## 47. Deployment Checklist

```
PRE-LAUNCH CHECKLIST — run through before first production deploy

ENVIRONMENT
  [ ] All Supabase Vault secrets set (ANTHROPIC_API_KEY, META_WHATSAPP_TOKEN, etc.)
  [ ] Vercel environment variables set for both web and public apps
  [ ] Supabase project region confirmed as ap-south-1 (Mumbai)
  [ ] Supabase email templates customized (confirmation, magic link)

DATABASE
  [ ] All migrations applied to production (supabase db push)
  [ ] pg_cron extension enabled
  [ ] pg_cron jobs created and verified
  [ ] RLS enabled on all tables (verify: SELECT tablename, rowsecurity FROM pg_tables)
  [ ] Materialized views created and indexed
  [ ] Storage buckets created with correct public/private settings

AGENTS
  [ ] All Edge Functions deployed (supabase functions deploy)
  [ ] Test each agent manually:
      [ ] POST /functions/v1/digest-agent with service role key → verify notification created
      [ ] POST /functions/v1/booking-agent {"job":"check_reminders"} → verify no errors
      [ ] POST /functions/v1/whatsapp-agent with test phone number → verify message received
  [ ] pg_cron jobs visible in Supabase dashboard

EXTERNAL INTEGRATIONS
  [ ] Meta WhatsApp webhook verified (GET /webhook-whatsapp returns challenge)
  [ ] Razorpay webhook configured in dashboard to /webhook-razorpay
  [ ] Razorpay webhook events selected: payment.captured, payment.failed
  [ ] SendGrid sender domain verified

SECURITY
  [ ] Supabase anon key ONLY in frontend (never service role)
  [ ] Service role key ONLY in Edge Functions via Supabase secrets
  [ ] CORS configured in Supabase (allowed origins: app domain + public domain)
  [ ] CSP headers set in Vercel (vercel.json headers)
  [ ] All file upload endpoints validate MIME type and size

PERFORMANCE
  [ ] Lighthouse score > 90 on mobile (run on /dashboard after login)
  [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
  [ ] Lazy loading on all page routes (confirm lazy() in router.tsx)
  [ ] Images optimized (WebP, correct sizes)

MONITORING
  [ ] Sentry DSN set in Vercel and VITE_SENTRY_DSN in .env
  [ ] Uptime Robot monitors set up for app.nicheflow.in and p.nicheflow.in
  [ ] Slack channel #nicheflow-alerts connected to Sentry + Uptime Robot
  [ ] PostHog initialized (confirm events firing in PostHog dashboard)

FUNCTIONAL SMOKE TESTS
  [ ] Sign up → onboarding → dashboard reachable
  [ ] Create client → create booking → confirm WhatsApp sent
  [ ] Create invoice → send → open public link → pay (test mode)
  [ ] Public page → book → booking appears in dashboard
  [ ] AI Assistant → "Show today's schedule" → correct response
  [ ] Hindi mode → all UI strings translated (check Settings)
  [ ] Mobile: test on iPhone SE viewport (375px), all bottom nav items accessible
```

---

## APPENDIX — AGENT QUICK REFERENCE

```
AGENT             TRIGGER                      AUTONOMY GATE    MAIN OUTPUT
──────────────────────────────────────────────────────────────────────────
Orchestrator      User message / tool call     Always active    Tool execution + reply
Digest Agent      Cron 6:50AM IST daily        Conservative+    Notification created
Booking Agent     Cron every 5min / webhook    Conservative+    WA message + DB update
Invoice Agent     Cron 9AM / booking complete  Balanced+        Draft invoice / WA msg
Client Agent      Cron 2AM / note saved        Any              DB update / notification
Inventory Agent   Cron 8AM daily               Any              Notification
Task Agent        Cron midnight / booking      Balanced+        Task rows created
WhatsApp Agent    Called by other agents       Rate-limited     Meta API call
SEO Agent         Page save webhook            Autonomous       DB update (meta fields)
Notification      Called by all agents         Always active    Notification row
```

---

*This document is the complete build specification for NicheFlow MVP.*
*Every file, every function signature, every database column, and every animation spring config is specified here.*
*A capable AI coding agent should produce a production-deployable codebase from this document alone.*

**Build order recommendation:**
1. DB migrations (001→013) → 2. Auth + workspace setup → 3. Core CRUD (clients, bookings, invoices) →
4. WhatsApp Agent → 5. Booking Agent (reminders) → 6. Invoice Agent (overdue) → 7. AI Orchestrator →
8. Dashboard → 9. Tasks + Inventory → 10. Public pages → 11. Onboarding wizard → 12. Polish (animations, i18n) → 13. Tests + CI/CD → 14. Deploy

---

**Document:** NicheFlow Master Build Blueprint v1.0
**Created:** June 2026
