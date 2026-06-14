import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/crud', '').replace(/^\//, '') // e.g. "tasks", "tasks/stats"
  const segments = path.split('/')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  let userId = null;
  let workspaceId = null;

  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    userId = user?.id
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', userId).single()
      workspaceId = profile?.workspace_id
    }
  }

  try {
    const table = segments[0]
    const action = segments[1]

    // STATS ENDPOINTS
    if (action === 'stats' || action === 'top-revenue' || path === 'dashboard/stats') {
      if (!workspaceId) return new Response(JSON.stringify({}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      const { data: summary } = await supabase.rpc('get_business_summary', { p_workspace_id: workspaceId });
      
      let data: any = {};
      
      if (path === 'tasks/stats') {
        const { count: pending } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'pending');
        const { count: completed } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'completed');
        data = { total: (pending||0) + (completed||0), completed: completed || 0, pending: pending || 0, overdue: summary?.tasks_overdue || 0 };
      }
      else if (path === 'clients/stats') {
        const { count: total } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
        data = { total: total || 0, active: total || 0, churn_risk: 0, mrr: summary?.revenue_mtd || 0 };
      }
      else if (path === 'clients/top-revenue') {
        data = []; // Too complex for MVP, leave empty
      }
      else if (path === 'invoices/stats') {
        data = { total: 0, paid: 0, unpaid: summary?.invoices_unpaid > 0 ? 1 : 0, unpaidAmount: summary?.invoices_unpaid || 0 };
      }
      else if (path === 'inventory/stats') {
        data = { totalItems: 0, lowStock: summary?.inventory_alerts || 0, outOfStock: 0 };
      }
      else if (path === 'dashboard/stats') {
         data = {
           todayBookings: summary?.bookings_today || 0, pendingInvoices: summary?.invoices_unpaid > 0 ? 1 : 0, pendingInvoicesAmount: summary?.invoices_unpaid || 0,
           totalClients: 0, overdueTasks: summary?.tasks_overdue || 0, pendingTasks: 0, totalRevenue: summary?.revenue_mtd || 0,
           recentBookings: [], recentActivity: [], revenueLast7Days: []
         };
      }
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // SETTINGS / PUBLIC PAGE / NOTIFICATIONS (Mocks for MVP)
    if (table === 'settings' || table === 'public-page' || table === 'notifications') {
      if (req.method === 'GET') return new Response(JSON.stringify(table === 'notifications' ? [] : {}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // GENERIC CRUD
    if (!workspaceId) {
      return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'GET') {
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 100;
      let query = supabase.from(table).select('*').eq('workspace_id', workspaceId).limit(limit);
      
      // Expand foreign keys if needed based on typical REST usage
      if (table === 'bookings') query = supabase.from(table).select('*, clients(*), services(*)').eq('workspace_id', workspaceId).limit(limit);
      if (table === 'invoices') query = supabase.from(table).select('*, clients(*)').eq('workspace_id', workspaceId).limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { data, error } = await supabase.from(table).insert({ ...body, workspace_id: workspaceId }).select().single()
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = await req.json()
      const id = segments[1] || body.id
      const { data, error } = await supabase.from(table).update(body).eq('id', id).eq('workspace_id', workspaceId).select().single()
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (req.method === 'DELETE') {
      const id = segments[1]
      const { error } = await supabase.from(table).delete().eq('id', id).eq('workspace_id', workspaceId)
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
