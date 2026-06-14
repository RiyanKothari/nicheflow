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