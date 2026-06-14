// supabase/functions/webhook-razorpay/index.ts
import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')

  if (!secret) {
    console.log('[MOCK RAZORPAY] Missing secret. Assuming valid signature for local dev.')
  } else {
    const expectedSignature = createHmac('sha256', secret).update(body).digest('hex')
    if (expectedSignature !== signature) {
      return new Response('Invalid signature', { status: 401 })
    }
  }

  const event = JSON.parse(body)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const invoiceId = payment.notes?.invoice_id

    if (invoiceId) {
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        amount: payment.amount / 100,
        method: 'razorpay',
        reference: payment.id,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id
      })

      const { data: invoice } = await supabase
        .from('invoices')
        .select('total, amount_paid, workspace_id, clients(name, phone_e164)')
        .eq('id', invoiceId)
        .single()

      const newAmountPaid = (invoice?.amount_paid || 0) + (payment.amount / 100)
      const isPaid = newAmountPaid >= (invoice?.total || 0)

      await supabase.from('invoices').update({
        amount_paid: newAmountPaid,
        status: isPaid ? 'paid' : 'partial',
        paid_at: isPaid ? new Date().toISOString() : null
      }).eq('id', invoiceId)

      if (isPaid) {
        const client = invoice?.clients as Record<string, unknown>
        if (client?.phone_e164) {
          await supabase.functions.invoke('whatsapp-agent', {
            body: {
              phone: client.phone_e164,
              message: `✅ Payment Received! ₹${payment.amount / 100} has been received. Thank you, ${client.name}! 🙏`
            }
          })
        }
      }
    }
  }

  return new Response(JSON.stringify({ received: true }))
})
