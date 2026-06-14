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