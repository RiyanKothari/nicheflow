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