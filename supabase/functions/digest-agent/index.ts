// supabase/functions/digest-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  // Get all active workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, business_type, language')
    .eq('onboarding_completed', true)

  for (const workspace of workspaces || []) {
    try {
      const { data: summary } = await supabase.rpc('get_business_summary', {
        p_workspace_id: workspace.id
      })

      // Get today's bookings
      const today = new Date().toISOString().split('T')[0]
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('start_time, title, clients(name), services(name)')
        .eq('workspace_id', workspace.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .eq('status', 'confirmed')
        .order('start_time')

      // Get overdue tasks
      const { data: overdueTasks } = await supabase
        .from('tasks')
        .select('title, due_date, priority')
        .eq('workspace_id', workspace.id)
        .lt('due_date', new Date().toISOString())
        .neq('status', 'done')
        .limit(5)

      const prompt = `Generate a morning business brief for ${workspace.name} (${workspace.business_type}).

Data:
- Today's bookings (${todayBookings?.length || 0}): ${JSON.stringify(todayBookings?.slice(0, 5))}
- Overdue tasks: ${JSON.stringify(overdueTasks)}
- Revenue this month: ₹${summary?.revenue_mtd}
- Unpaid invoices: ₹${summary?.invoices_unpaid}
- Inventory alerts: ${summary?.inventory_alerts}

Write a brief, friendly morning summary in ${workspace.language === 'hi' ? 'Hindi' : 'English'}.
Format: 3-5 bullet points. Start with the most important item.
Tone: Like a smart assistant giving a quick briefing. No fluff.
Keep under 150 words.`

      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })

      const digestText = response.content[0].type === 'text' ? response.content[0].text : ''

      // Store as notification
      await supabase.from('notifications').insert({
        workspace_id: workspace.id,
        type: 'digest',
        title: `Good morning! Here's your ${new Date().toLocaleDateString('en-IN', { weekday: 'long' })} brief`,
        body: digestText
      })

      // Log agent action
      await supabase.from('agent_actions_log').insert({
        workspace_id: workspace.id,
        agent_id: 'digest_agent',
        action_type: 'generate_digest',
        description: 'Generated morning business brief',
        status: 'completed',
        tokens_used: response.usage.input_tokens + response.usage.output_tokens
      })
    } catch (err) {
      console.error(`Digest failed for workspace ${workspace.id}:`, err)
    }
  }

  return new Response(JSON.stringify({ ok: true }))
})
