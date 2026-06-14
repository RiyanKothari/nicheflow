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