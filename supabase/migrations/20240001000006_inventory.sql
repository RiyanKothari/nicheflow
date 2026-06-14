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