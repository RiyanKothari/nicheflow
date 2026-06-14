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