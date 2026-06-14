// supabase/functions/whatsapp-agent/index.ts
// Rate limit: 10 messages/minute per workspace via Upstash

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redisUrl = Deno.env.get('UPSTASH_REDIS_URL');
const redisToken = Deno.env.get('UPSTASH_REDIS_TOKEN');
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m')
}) : null;

Deno.serve(async (req) => {
  const { phone, message, workspace_id, template_name, template_params } = await req.json()

  if (ratelimit) {
    const { success } = await ratelimit.limit(`whatsapp:${workspace_id}`)
    if (!success) {
      return new Response(JSON.stringify({ queued: true }), { status: 429 })
    }
  }

  const TOKEN = Deno.env.get('META_WHATSAPP_TOKEN')
  const PHONE_ID = Deno.env.get('META_WHATSAPP_PHONE_ID')

  const body = template_name
    ? {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: template_name,
          language: { code: 'en_IN' },
          components: template_params || []
        }
      }
    : {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message, preview_url: false }
      }

  if (!TOKEN || !PHONE_ID) {
    console.log('[MOCK WHATSAPP]', body)
    return new Response(JSON.stringify({ messages: [{ id: 'mock-id' }] }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )

  const result = await response.json()
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
