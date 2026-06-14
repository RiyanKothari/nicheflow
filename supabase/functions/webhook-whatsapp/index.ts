// supabase/functions/webhook-whatsapp/index.ts
Deno.serve(async (req) => {
  // GET: webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 })
    }
    return new Response('Forbidden', { status: 403 })
  }

  // POST: incoming messages
  const body = await req.json()
  // Future: handle incoming WhatsApp messages (client replies)
  // For now: just acknowledge
  return new Response(JSON.stringify({ received: true }))
})
