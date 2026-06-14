// supabase/functions/booking-agent/index.ts
import { createClient } from '@supabase/supabase-js'

const JOB_HANDLERS: Record<string, Function> = {
  check_reminders: checkAndSendReminders,
  handle_no_show: handleNoShow,
  send_confirmation: sendConfirmation,
  process_cancellation: processCancellation
}

async function checkAndSendReminders(supabase: ReturnType<typeof createClient>) {
  const now = new Date()

  // 24h reminder: bookings starting in 23-25 hours that haven't been reminded
  const h24from = new Date(now.getTime() + 23 * 3600000).toISOString()
  const h24to = new Date(now.getTime() + 25 * 3600000).toISOString()

  const { data: bookings24h } = await supabase
    .from('bookings')
    .select('*, clients(name, phone, phone_e164), services(name), workspaces(name, language)')
    .eq('status', 'confirmed')
    .eq('reminder_24h_sent', false)
    .gte('start_time', h24from)
    .lte('start_time', h24to)

  for (const booking of bookings24h || []) {
    await sendWhatsAppReminder(supabase, booking, '24h')
    await supabase.from('bookings').update({ reminder_24h_sent: true }).eq('id', booking.id)
  }

  // 2h reminder
  const h2from = new Date(now.getTime() + 1.5 * 3600000).toISOString()
  const h2to = new Date(now.getTime() + 2.5 * 3600000).toISOString()

  const { data: bookings2h } = await supabase
    .from('bookings')
    .select('*, clients(name, phone, phone_e164), services(name), workspaces(name, language)')
    .eq('status', 'confirmed')
    .eq('reminder_2h_sent', false)
    .gte('start_time', h2from)
    .lte('start_time', h2to)

  for (const booking of bookings2h || []) {
    await sendWhatsAppReminder(supabase, booking, '2h')
    await supabase.from('bookings').update({ reminder_2h_sent: true }).eq('id', booking.id)
  }

  // No-show check: bookings that ended >30min ago, still 'confirmed', no check-in
  const noShowThreshold = new Date(now.getTime() - 30 * 60000).toISOString()
  const { data: possibleNoShows } = await supabase
    .from('bookings')
    .select('*, clients(name, phone_e164), workspaces(id)')
    .eq('status', 'confirmed')
    .lt('end_time', noShowThreshold)
    .is('checked_in_at', null)

  for (const booking of possibleNoShows || []) {
    await supabase.from('bookings').update({ status: 'no_show' }).eq('id', booking.id)
    await supabase.from('agent_actions_log').insert({
      workspace_id: booking.workspace_id,
      agent_id: 'booking_agent',
      action_type: 'mark_no_show',
      entity_type: 'booking',
      entity_id: booking.id,
      description: `Marked booking for ${booking.clients?.name} as no-show`,
      status: 'completed'
    })
    await supabase.from('notifications').insert({
      workspace_id: booking.workspace_id,
      type: 'no_show',
      title: `No-show: ${booking.clients?.name}`,
      body: `${booking.clients?.name} didn't show up for their ${booking.title} appointment.`,
      action_url: `/bookings/${booking.id}`
    })
  }
}

async function sendWhatsAppReminder(
  supabase: ReturnType<typeof createClient>,
  booking: Record<string, unknown>,
  type: '24h' | '2h'
) {
  const phone = (booking.clients as Record<string, unknown>)?.phone_e164 as string
  if (!phone) return

  const bookingDate = new Date(booking.start_time as string)
  const timeStr = bookingDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = type === '24h'
    ? `tomorrow at ${timeStr}`
    : `in about 2 hours (${timeStr})`

  const message = `Hi ${(booking.clients as Record<string, unknown>)?.name}! 👋\n\nReminder: Your ${(booking.services as Record<string, unknown>)?.name} appointment is ${dateStr}.\n\nLocation: ${booking.location || 'To be confirmed'}\n\nSee you soon! 🙏`

  await supabase.functions.invoke('whatsapp-agent', {
    body: { phone, message, booking_id: booking.id }
  })
}

async function sendConfirmation(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>
) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, clients(name, phone_e164), services(name, price)')
    .eq('id', payload.booking_id)
    .single()

  if (!booking || booking.confirmation_sent) return

  const phone = booking.clients?.phone_e164
  if (!phone) return

  const message = `✅ Booking Confirmed!\n\nHi ${booking.clients?.name}, your ${booking.services?.name} is confirmed.\n\n📅 Date: ${new Date(booking.start_time).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}\n⏰ Time: ${new Date(booking.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n💰 Price: ₹${booking.services?.price || 'TBD'}\n\nThank you for booking with us! 🙏`

  await supabase.functions.invoke('whatsapp-agent', { body: { phone, message } })
  await supabase.from('bookings').update({ confirmation_sent: true }).eq('id', booking.id)
}

async function handleNoShow() {} // Handled in check_reminders
async function processCancellation() {}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const handler = JOB_HANDLERS[body.job]
  if (handler) await handler(supabase, body)

  return new Response(JSON.stringify({ ok: true }))
})
