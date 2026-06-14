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