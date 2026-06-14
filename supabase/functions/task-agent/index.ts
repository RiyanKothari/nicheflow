// supabase/functions/task-agent/index.ts
import { createClient } from '@supabase/supabase-js'

const TASK_TEMPLATES: Record<string, string[]> = {
  dog_trainer: ['Prepare training plan', 'Set up training area', 'Review session notes', 'Send progress report'],
  tailor: ['Take measurements', 'Source fabric', 'Cut fabric', 'First fitting', 'Final fitting', 'Delivery'],
  photographer: ['Confirm shoot details', 'Pack equipment', 'Backup photos', 'Edit photos', 'Deliver gallery'],
  urban_farmer: ['Check crop status', 'Harvest produce', 'Pack delivery boxes', 'Confirm delivery route'],
  yoga_studio: ['Prepare class playlist', 'Set up studio', 'Send class reminder', 'Update attendance']
}

async function generateRecurringTasks(supabase: ReturnType<typeof createClient>) {
  const { data: recurringTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_recurring', true)
    .neq('status', 'cancelled')
    .not('recurrence_rule', 'is', null)

  for (const task of recurringTasks || []) {
    const rule = task.recurrence_rule as Record<string, unknown>
    const shouldCreateToday = checkRecurrenceRule(rule)
    if (!shouldCreateToday) continue

    // Check if today's occurrence already exists
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('recurrence_parent_id', task.id)
      .gte('created_at', `${today}T00:00:00`)
      .single()

    if (existing) continue

    await supabase.from('tasks').insert({
      workspace_id: task.workspace_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee_id: task.assignee_id,
      client_id: task.client_id,
      due_date: new Date().toISOString(),
      recurrence_parent_id: task.id,
      tags: task.tags
    })
  }
}

function checkRecurrenceRule(rule: Record<string, unknown>): boolean {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const dayOfMonth = today.getDate()

  if (rule.frequency === 'daily') return true
  if (rule.frequency === 'weekly') {
    const days = (rule.days as number[]) || []
    return days.includes(dayOfWeek)
  }
  if (rule.frequency === 'monthly') {
    return dayOfMonth === (rule.day as number)
  }
  return false
}

async function createTasksFromBooking(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  businessType: string
) {
  const templates = TASK_TEMPLATES[businessType] || []
  const { data: booking } = await supabase
    .from('bookings')
    .select('workspace_id, client_id, start_time, title')
    .eq('id', bookingId)
    .single()

  if (!booking) return

  const tasks = templates.map((title, i) => ({
    workspace_id: booking.workspace_id,
    client_id: booking.client_id,
    booking_id: bookingId,
    title,
    due_date: booking.start_time,
    priority: i === 0 ? 'high' : 'normal',
    sort_order: i
  }))

  await supabase.from('tasks').insert(tasks)
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  if (body.job === 'generate_recurring') await generateRecurringTasks(supabase)
  if (body.job === 'create_from_booking') {
    await createTasksFromBooking(supabase, body.booking_id, body.business_type)
  }
  return new Response(JSON.stringify({ ok: true }))
})
