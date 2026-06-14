import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')!
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const url = new URL(req.url)
  const path = url.pathname.split('/').pop() // e.g., 'status', 'generate', 'complete', 'config'

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    const workspaceId = profile?.workspace_id

    if (path === 'status') {
      if (!workspaceId) return new Response(JSON.stringify({ completed: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      const { data: ws } = await supabase
        .from('workspaces')
        .select('onboarding_completed')
        .eq('id', workspaceId)
        .single()
        
      return new Response(JSON.stringify({ completed: ws?.onboarding_completed || false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (path === 'config') {
      if (!workspaceId) return new Response(JSON.stringify({}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      
      const { data: ws } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single()
        
      return new Response(JSON.stringify(ws || {}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (path === 'complete') {
      if (workspaceId) {
        await supabase.from('workspaces').update({ onboarding_completed: true }).eq('id', workspaceId)
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (path === 'generate') {
      const { description } = await req.json()      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      let text = '';

      if (!apiKey) {
        console.log('[MOCK AI] Missing Anthropic key. Returning mock onboarding data.');
        text = JSON.stringify({
          businessName: "Mock Business",
          niche: "salon",
          nicheEmoji: "✂️",
          terminology: { clients: "Clients", bookings: "Appointments", inventory: "Stock", tasks: "Tasks" },
          services: ["Haircut", "Color", "Styling"],
          kanbanColumns: ["Booked", "Checked In", "In Progress", "Completed"],
          modules: ["clients", "bookings"],
          color: "coral",
          dashboardMetric: "Appointments Today",
          suggestedTagline: "Mock tagline for your showcase!"
        });
      } else {
        const anthropic = new Anthropic({ apiKey })
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Analyze this business description: "${description}".
            Generate a JSON configuration for a SaaS platform.
            Include:
            - businessName (string)
            - niche (string)
            - nicheEmoji (string)
            - terminology: { clients: string, bookings: string, inventory: string, tasks: string }
            - services: string[]
            - kanbanColumns: string[] (exactly 4 stages)
            - modules: string[] (choose from clients, bookings, invoices, inventory, tasks)
            - color: string (purple, teal, coral, amber)
            - dashboardMetric: string (e.g., "Classes Today", "Active Projects")
            - suggestedTagline: string
            Output ONLY valid JSON. No markdown wrappers.`
          }]
        })
        text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      }

      const config = JSON.parse(text)

      let activeWorkspaceId = workspaceId

      // Create workspace if it doesn't exist
      if (!activeWorkspaceId) {
        const { data: newWs } = await supabase.from('workspaces').insert({
          name: config.businessName || 'My Business',
          business_type: config.niche,
          terminology: config.terminology,
          modules: config.modules,
          color: config.color,
          services: config.services,
          kanban_columns: config.kanbanColumns,
          niche_emoji: config.nicheEmoji,
          dashboard_metric: config.dashboardMetric,
          suggested_tagline: config.suggestedTagline
        }).select().single()
        
        activeWorkspaceId = newWs?.id
        
        if (activeWorkspaceId) {
          await supabase.from('profiles').update({ workspace_id: activeWorkspaceId }).eq('id', user.id)
        }
      } else {
        await supabase.from('workspaces').update({
          name: config.businessName || 'My Business',
          business_type: config.niche,
          terminology: config.terminology,
          modules: config.modules,
          color: config.color,
          services: config.services,
          kanban_columns: config.kanbanColumns,
          niche_emoji: config.nicheEmoji,
          dashboard_metric: config.dashboardMetric,
          suggested_tagline: config.suggestedTagline
        }).eq('id', activeWorkspaceId)
      }

      // Add default dummy data
      if (activeWorkspaceId) {
        // Create some sample clients
        await supabase.from('clients').insert([
          { workspace_id: activeWorkspaceId, name: 'Sample Client 1', email: 'client1@example.com', phone: '1234567890' },
          { workspace_id: activeWorkspaceId, name: 'Sample Client 2', email: 'client2@example.com', phone: '0987654321' }
        ])
        
        // Create sample services
        if (config.services?.length > 0) {
          const serviceInserts = config.services.map((s: string) => ({
            workspace_id: activeWorkspaceId,
            name: s,
            price: 1500,
            duration_minutes: 60
          }))
          await supabase.from('services').insert(serviceInserts)
        }
      }

      return new Response(JSON.stringify({ config }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
