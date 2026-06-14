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