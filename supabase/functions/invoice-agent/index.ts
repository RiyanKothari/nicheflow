// supabase/functions/invoice-agent/index.ts
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

async function checkOverdueInvoices(supabase: ReturnType<typeof createClient>) {
  const today = new Date()

  // 3-day overdue
  const { data: overdue3d } = await supabase
    .from('invoices')
    .select('*, clients(name, phone_e164, email), workspaces(name)')
    .in('status', ['sent', 'partial'])
    .eq('reminder_3d_sent', false)
    .lte('due_date', new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0])

  for (const invoice of overdue3d || []) {
    await sendOverdueReminder(supabase, invoice, 3)
    await supabase.from('invoices')
      .update({ reminder_3d_sent: true, status: 'overdue' })
      .eq('id', invoice.id)
  }

  // 7-day overdue
  const { data: overdue7d } = await supabase
    .from('invoices')
    .select('*, clients(name, phone_e164), workspaces(name)')
    .in('status', ['sent', 'partial', 'overdue'])
    .eq('reminder_7d_sent', false)
    .lte('due_date', new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0])

  for (const invoice of overdue7d || []) {
    await sendOverdueReminder(supabase, invoice, 7)
    await supabase.from('invoices').update({ reminder_7d_sent: true }).eq('id', invoice.id)
  }

  // 14-day overdue
  const { data: overdue14d } = await supabase
    .from('invoices')
    .select('*, clients(name, phone_e164), workspaces(name)')
    .in('status', ['sent', 'partial', 'overdue'])
    .eq('reminder_14d_sent', false)
    .lte('due_date', new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0])

  for (const invoice of overdue14d || []) {
    await sendOverdueReminder(supabase, invoice, 14)
    await supabase.from('invoices').update({ reminder_14d_sent: true }).eq('id', invoice.id)
  }
}

async function sendOverdueReminder(
  supabase: ReturnType<typeof createClient>,
  invoice: Record<string, unknown>,
  days: number
) {
  const client = invoice.clients as Record<string, unknown>
  const workspace = invoice.workspaces as Record<string, unknown>
  const phone = client?.phone_e164 as string

  const tones: Record<number, string> = {
    3: `Hi ${client?.name}! 😊 Just a friendly reminder that invoice #${invoice.invoice_number} for ₹${invoice.amount_due} was due ${days} days ago. Please pay at your earliest convenience. Payment link: ${process.env.VITE_APP_URL}/invoice/${invoice.public_token}`,
    7: `Dear ${client?.name}, This is a reminder that invoice #${invoice.invoice_number} (₹${invoice.amount_due}) is now 7 days overdue. Please clear the payment to avoid any inconvenience. Pay here: ${process.env.VITE_APP_URL}/invoice/${invoice.public_token}`,
    14: `Dear ${client?.name}, Invoice #${invoice.invoice_number} for ₹${invoice.amount_due} is now 14 days overdue. This is our final reminder. Please settle immediately. Pay: ${process.env.VITE_APP_URL}/invoice/${invoice.public_token} — ${workspace?.name} Team`
  }

  if (phone && tones[days]) {
    await supabase.functions.invoke('whatsapp-agent', {
      body: { phone, message: tones[days] }
    })
  }

  await supabase.from('agent_actions_log').insert({
    workspace_id: invoice.workspace_id,
    agent_id: 'invoice_agent',
    action_type: 'overdue_reminder',
    entity_type: 'invoice',
    entity_id: invoice.id,
    description: `Sent ${days}-day overdue reminder to ${client?.name} for invoice #${invoice.invoice_number}`,
    status: 'completed'
  })
}

async function generateInvoiceFromBooking(
  supabase: ReturnType<typeof createClient>,
  bookingId: string
) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, clients(*), services(*), workspaces(*)')
    .eq('id', bookingId)
    .single()

  if (!booking || !booking.clients) return

  const invoiceNumber = await supabase.rpc('generate_invoice_number', {
    p_workspace_id: booking.workspace_id
  })

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      workspace_id: booking.workspace_id,
      client_id: booking.client_id,
      booking_id: booking.id,
      invoice_number: invoiceNumber.data,
      status: 'draft',
      due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    })
    .select()
    .single()

  if (invoice) {
    await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      description: booking.services?.name || booking.title,
      quantity: 1,
      unit_price: booking.price || booking.services?.price || 0
    })

    await supabase.from('agent_actions_log').insert({
      workspace_id: booking.workspace_id,
      agent_id: 'invoice_agent',
      action_type: 'auto_generate_invoice',
      entity_type: 'invoice',
      entity_id: invoice.id,
      description: `Auto-generated draft invoice #${invoiceNumber.data} for ${booking.clients.name}`,
      status: 'completed'
    })

    // Notify owner
    await supabase.from('notifications').insert({
      workspace_id: booking.workspace_id,
      type: 'invoice_generated',
      title: `Invoice drafted for ${booking.clients.name}`,
      body: `Invoice #${invoiceNumber.data} (₹${booking.price || booking.services?.price || 0}) is ready to send.`,
      action_url: `/invoices/${invoice.id}`
    })
  }
}

Deno.serve(async (req) => {
  const body = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (body.job === 'check_overdue') await checkOverdueInvoices(supabase)
  if (body.job === 'generate_from_booking') await generateInvoiceFromBooking(supabase, body.booking_id)

  return new Response(JSON.stringify({ ok: true }))
})
