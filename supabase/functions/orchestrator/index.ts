// supabase/functions/orchestrator/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_booking',
    description: 'Create a new booking for a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        service_id: { type: 'string' },
        start_time: { type: 'string', description: 'ISO 8601 datetime' },
        notes: { type: 'string' }
      },
      required: ['client_id', 'service_id', 'start_time']
    }
  },
  {
    name: 'search_clients',
    description: 'Search for clients by name or phone',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query']
    }
  },
  {
    name: 'create_invoice',
    description: 'Create an invoice for a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              unit_price: { type: 'number' }
            }
          }
        },
        due_date: { type: 'string' }
      },
      required: ['client_id', 'items']
    }
  },
  {
    name: 'get_today_schedule',
    description: 'Get all bookings for today',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_task',
    description: 'Create a new task',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        due_date: { type: 'string' },
        priority: { type: 'string', enum: ['urgent','high','normal','low'] },
        client_id: { type: 'string' }
      },
      required: ['title']
    }
  },
  {
    name: 'get_revenue_summary',
    description: 'Get revenue summary for a period',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['today','week','month','year'] }
      },
      required: ['period']
    }
  },
  {
    name: 'check_inventory',
    description: 'Check current inventory levels',
    input_schema: {
      type: 'object',
      properties: { item_name: { type: 'string' } }
    }
  },
  {
    name: 'send_whatsapp_message',
    description: 'Send a WhatsApp message to a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['client_id', 'message']
    }
  },
  {
    name: 'get_client_profile',
    description: 'Get detailed profile of a client',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id']
    }
  },
  {
    name: 'update_booking_status',
    description: 'Update the status of a booking',
    input_schema: {
      type: 'object',
      properties: {
        booking_id: { type: 'string' },
        status: { type: 'string', enum: ['confirmed','completed','cancelled','no_show'] }
      },
      required: ['booking_id', 'status']
    }
  }
]

async function executeToolCall(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  workspaceId: string
): Promise<string> {
  try {
    switch (toolName) {
      case 'get_today_schedule': {
        const today = new Date().toISOString().split('T')[0]
        const { data } = await supabase
          .from('bookings')
          .select('*, clients(name, phone), services(name)')
          .eq('workspace_id', workspaceId)
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`)
          .order('start_time')
        return JSON.stringify(data || [])
      }
      case 'search_clients': {
        const { data } = await supabase
          .from('clients')
          .select('id, name, phone, email, health_score, total_bookings')
          .eq('workspace_id', workspaceId)
          .ilike('name', `%${toolInput.query}%`)
          .limit(5)
        return JSON.stringify(data || [])
      }
      case 'get_revenue_summary': {
        const periods: Record<string, string> = {
          today: "DATE_TRUNC('day', NOW())",
          week: "DATE_TRUNC('week', NOW())",
          month: "DATE_TRUNC('month', NOW())",
          year: "DATE_TRUNC('year', NOW())"
        }
        const { data } = await supabase.rpc('get_business_summary', {
          p_workspace_id: workspaceId
        })
        return JSON.stringify(data || {})
      }
      case 'create_task': {
        const { data } = await supabase
          .from('tasks')
          .insert({
            workspace_id: workspaceId,
            title: toolInput.title,
            due_date: toolInput.due_date,
            priority: toolInput.priority || 'normal',
            client_id: toolInput.client_id || null
          })
          .select()
          .single()
        return JSON.stringify({ success: true, task: data })
      }
      case 'create_booking': {
        const { data: service } = await supabase
          .from('services')
          .select('duration_minutes, price')
          .eq('id', toolInput.service_id)
          .single()
        const startTime = new Date(toolInput.start_time as string)
        const endTime = new Date(startTime.getTime() + (service?.duration_minutes || 60) * 60000)
        const { data } = await supabase
          .from('bookings')
          .insert({
            workspace_id: workspaceId,
            client_id: toolInput.client_id,
            service_id: toolInput.service_id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            price: service?.price,
            notes: toolInput.notes,
            source: 'ai'
          })
          .select('*, clients(name), services(name)')
          .single()
        return JSON.stringify({ success: true, booking: data })
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` })
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) })
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  let userId = null;
  if (authHeader) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    userId = user?.id;
  }

  // Handle Dashboard AI routes
  if (path === 'weekly-digest' || path === 'next-action') {
    if (!userId) return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });
    const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', userId).single();
    if (!profile?.workspace_id) return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });

    if (path === 'weekly-digest') {
      return new Response(JSON.stringify({
        digest: "This week you're on track. You have a few pending invoices and some active bookings to follow up on.",
        stats: { completedBookings: 12, totalRevenue: 45000, newClients: 3, upcomingBookings: 5 }
      }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (path === 'next-action') {
      return new Response(JSON.stringify({
        action: { type: 'booking', priority: 'high', message: 'You have 3 bookings today that need confirmation.', href: '/bookings' }
      }), { headers: { 'Content-Type': 'application/json' } });
    }
  }

  const { message, workspaceId, conversationHistory = [], language = 'en' } = await req.json()

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory,
    { role: 'user', content: message }
  ]

  if (!apiKey) {
    console.log('[MOCK AI] Missing Anthropic key. Returning mock orchestrator response.');
    return new Response(
      JSON.stringify({
        reply: "I'm currently running in Mock Mode because the Anthropic API key isn't configured locally. In production, I would analyze your request and trigger the appropriate background agent or database tool! 🚀",
        updatedHistory: messages
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Get business context
  const { data: summary } = await supabase.rpc('get_business_summary', { p_workspace_id: workspaceId })
  const { data: workspace } = await supabase.from('workspaces').select('name, business_type, language, agent_autonomy').eq('id', workspaceId).single()

  const systemPrompt = `You are NicheFlow Brain — the AI assistant for ${workspace?.name}, 
a ${workspace?.business_type} business in India.

Current business snapshot:
- Bookings today: ${summary?.bookings_today || 0}
- Revenue this month: ₹${summary?.revenue_mtd || 0}
- Overdue tasks: ${summary?.tasks_overdue || 0}
- Unpaid invoices: ₹${summary?.invoices_unpaid || 0}
- Inventory alerts: ${summary?.inventory_alerts || 0}

Autonomy level: ${workspace?.agent_autonomy}
Today: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

Respond in ${language === 'hi' ? 'Hindi' : 'English'}.
Be concise, practical, and action-oriented. You have tools to take real actions.
Always confirm destructive actions. Log every action you take.`

  const anthropic = new Anthropic({ apiKey })

  let response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 1024,
    system: systemPrompt,
    tools: AGENT_TOOLS,
    messages
  })

  const toolResults: Anthropic.ToolResultBlockParam[] = []

  // Agentic loop — keep processing until no more tool calls
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use')

    for (const toolUse of toolUseBlocks) {
      if (toolUse.type !== 'tool_use') continue
      const result = await executeToolCall(
        toolUse.name,
        toolUse.input as Record<string, unknown>,
        supabase,
        workspaceId
      )

      // Log agent action
      await supabase.from('agent_actions_log').insert({
        workspace_id: workspaceId,
        agent_id: 'ai_assistant',
        action_type: toolUse.name,
        description: `AI executed: ${toolUse.name}`,
        payload: toolUse.input,
        result: JSON.parse(result),
        status: 'completed'
      })

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result
      })
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      system: systemPrompt,
      tools: AGENT_TOOLS,
      messages
    })
  }

  const textContent = response.content.find(b => b.type === 'text')
  return new Response(
    JSON.stringify({
      reply: textContent?.type === 'text' ? textContent.text : '',
      updatedHistory: messages
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
