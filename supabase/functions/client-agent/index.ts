// supabase/functions/client-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function recalculateHealthScores(supabase: ReturnType<typeof createClient>) {
  // Refresh materialized view (fast)
  await supabase.rpc('exec', { sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_health' })

  // Update clients table from materialized view
  await supabase.rpc('exec', {
    sql: `UPDATE clients c SET health_score = mv.health_score
          FROM mv_client_health mv WHERE c.id = mv.client_id`
  })

  // Flag churn-risk clients (health_score < 30, last interaction > 45 days)
  const { data: churnRisk } = await supabase
    .from('clients')
    .select('id, name, workspace_id, phone_e164, last_interaction_at')
    .lt('health_score', 30)
    .lt('last_interaction_at', new Date(Date.now() - 45 * 86400000).toISOString())

  for (const client of churnRisk || []) {
    await supabase.from('notifications').insert({
      workspace_id: client.workspace_id,
      type: 'churn_risk',
      title: `${client.name} may be drifting away`,
      body: `${client.name} hasn't interacted in over 45 days. Consider reaching out.`,
      action_url: `/clients/${client.id}`
    })
  }
}

async function checkBirthdays(supabase: ReturnType<typeof createClient>) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const month = tomorrow.getMonth() + 1
  const day = tomorrow.getDate()

  const { data: birthdays } = await supabase
    .from('clients')
    .select('id, name, phone_e164, workspace_id, workspaces(name, agent_autonomy)')
    .filter('date_of_birth', 'not.is', null)
    .filter(`date_of_birth`, 'like', `%-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`)

  for (const client of birthdays || []) {
    const workspace = client.workspaces as Record<string, unknown>
    if (workspace?.agent_autonomy === 'autonomous' && client.phone_e164) {
      await supabase.functions.invoke('whatsapp-agent', {
        body: {
          phone: client.phone_e164,
          message: `🎂 Happy Birthday ${client.name}! Wishing you a wonderful day! From all of us at ${workspace?.name} 🎉`
        }
      })
      await supabase.from('agent_actions_log').insert({
        workspace_id: client.workspace_id,
        agent_id: 'client_agent',
        action_type: 'send_birthday_wish',
        entity_type: 'client',
        entity_id: client.id,
        description: `Sent birthday wish to ${client.name}`,
        status: 'completed'
      })
    } else {
      // Just notify the owner
      await supabase.from('notifications').insert({
        workspace_id: client.workspace_id,
        type: 'birthday_reminder',
        title: `🎂 ${client.name}'s birthday is tomorrow`,
        body: `Send them a warm birthday message to strengthen your relationship.`,
        action_url: `/clients/${client.id}`
      })
    }
  }
}

async function summarizeNote(
  supabase: ReturnType<typeof createClient>,
  noteId: string
) {
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const { data: note } = await supabase
    .from('notes')
    .select('*, clients(name)')
    .eq('id', noteId)
    .single()

  if (!note?.content) return

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Analyze this business note about client ${note.clients?.name}:

"${note.content}"

Return JSON only:
{
  "summary": "one sentence summary",
  "tags": ["tag1", "tag2"],
  "action_items": ["action 1", "action 2"]
}`
    }]
  })

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
    await supabase.from('notes').update({
      ai_summary: parsed.summary,
      ai_tags: parsed.tags || [],
      ai_action_items: parsed.action_items || []
    }).eq('id', noteId)
  } catch {}
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (body.job === 'recalculate_health_scores') await recalculateHealthScores(supabase)
  if (body.job === 'check_birthdays') await checkBirthdays(supabase)
  if (body.job === 'summarize_note') await summarizeNote(supabase, body.note_id)

  return new Response(JSON.stringify({ ok: true }))
})
