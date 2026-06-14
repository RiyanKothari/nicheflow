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